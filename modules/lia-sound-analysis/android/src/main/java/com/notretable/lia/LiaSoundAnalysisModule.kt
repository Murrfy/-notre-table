package com.notretable.lia

import android.Manifest
import android.content.pm.PackageManager
import android.media.AudioRecord
import android.os.Bundle
import android.speech.tts.TextToSpeech
import android.speech.tts.UtteranceProgressListener
import androidx.core.content.ContextCompat
import androidx.core.os.bundleOf
import expo.modules.interfaces.permissions.PermissionsStatus
import expo.modules.kotlin.Promise
import expo.modules.kotlin.exception.Exceptions
import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition
import org.tensorflow.lite.support.audio.TensorAudio
import org.tensorflow.lite.task.audio.classifier.AudioClassifier
import java.util.Locale
import java.util.concurrent.ScheduledFuture
import java.util.concurrent.ScheduledThreadPoolExecutor
import java.util.concurrent.TimeUnit

class LiaSoundAnalysisModule : Module(), TextToSpeech.OnInitListener {
  companion object {
    private const val MODEL_ASSET = "yamnet.tflite"
    private const val CLASSIFY_INTERVAL_MS = 480L
    private const val SCORE_THRESHOLD = 0.18f
  }

  private var tts: TextToSpeech? = null
  private var ttsReady = false
  private var classifier: AudioClassifier? = null
  private var tensorAudio: TensorAudio? = null
  private var recorder: AudioRecord? = null
  private var executor: ScheduledThreadPoolExecutor? = null
  private var classificationTask: ScheduledFuture<*>? = null

  private val context
    get() = appContext.reactContext ?: throw Exceptions.ReactContextLost()

  override fun definition() = ModuleDefinition {
    Name("LiaSoundAnalysis")
    Events("onSoundClassification", "onSpeechState", "onSpeechTranscript", "onForegroundSpeechTranscript")

    OnCreate {
      tts = TextToSpeech(context, this@LiaSoundAnalysisModule)
    }

    Function("isSoundAnalysisAvailable") {
      hasModelAsset() && isRecordAudioDeclared()
    }

    Function("microphonePermissionStatus") {
      if (!hasModelAsset() || !isRecordAudioDeclared()) return@Function "unavailable"
      if (ContextCompat.checkSelfPermission(context, Manifest.permission.RECORD_AUDIO) == PackageManager.PERMISSION_GRANTED) "granted" else "undetermined"
    }

    AsyncFunction("requestMicrophonePermission") { promise: Promise ->
      if (!hasModelAsset() || !isRecordAudioDeclared()) {
        promise.resolve(false)
        return@AsyncFunction
      }
      val manager = appContext.permissions
      if (manager == null) {
        promise.resolve(false)
        return@AsyncFunction
      }
      manager.askForPermissions({ response ->
        promise.resolve(response[Manifest.permission.RECORD_AUDIO]?.status == PermissionsStatus.GRANTED)
      }, Manifest.permission.RECORD_AUDIO)
    }

    AsyncFunction("startSoundAnalysis") {
      startAnalysis()
    }

    AsyncFunction("stopSoundAnalysis") {
      stopAnalysis()
      Unit
    }

    // Form dictation stays fail-closed on Android while RECORD_AUDIO remains blocked by app configuration.
    Function("isSpeechRecognitionAvailable") { false }
    Function("speechRecognitionPermissionStatus") { "unavailable" }
    AsyncFunction("requestSpeechRecognitionPermission") { false }
    AsyncFunction("startSpeechRecognition") { _: String -> false }
    AsyncFunction("stopSpeechRecognition") { Unit }

    // Foreground wake/listen recognition will be enabled once Android RECORD_AUDIO + speech runtime are validated.
    Function("isForegroundAssistantAvailable") { false }
    AsyncFunction("startForegroundAssistant") { _: String -> false }
    AsyncFunction("stopForegroundAssistant") { Unit }

    Function("getVoices") {
      val engine = tts
      if (!ttsReady || engine == null) return@Function emptyList<Map<String, String>>()
      engine.voices.orEmpty().map { voice ->
        mapOf(
          "identifier" to voice.name,
          "name" to voice.name,
          "language" to voice.locale.toLanguageTag(),
          "quality" to if (voice.isNetworkConnectionRequired) "Network" else "Local"
        )
      }
    }

    AsyncFunction("speak") { text: String, languageTag: String, voiceIdentifier: String?, utteranceId: String ->
      val engine = tts ?: return@AsyncFunction false
      if (!ttsReady) return@AsyncFunction false
      val desired = engine.voices.orEmpty().firstOrNull { it.name == voiceIdentifier }
      if (desired != null) engine.voice = desired else engine.language = Locale.forLanguageTag(languageTag)
      engine.setSpeechRate(0.96f)
      engine.setPitch(1.0f)
      engine.speak(text, TextToSpeech.QUEUE_FLUSH, Bundle(), utteranceId)
      true
    }

    AsyncFunction("stopSpeech") {
      tts?.stop()
      Unit
    }

    OnDestroy {
      stopAnalysis()
      tts?.stop()
      tts?.shutdown()
      tts = null
      ttsReady = false
    }
  }

  private fun isRecordAudioDeclared(): Boolean = try {
    val info = context.packageManager.getPackageInfo(context.packageName, PackageManager.GET_PERMISSIONS)
    info.requestedPermissions?.contains(Manifest.permission.RECORD_AUDIO) == true
  } catch (_: Exception) {
    false
  }

  private fun hasModelAsset(): Boolean = try {
    context.assets.open(MODEL_ASSET).use { true }
  } catch (_: Exception) {
    false
  }

  private fun startAnalysis(): Boolean {
    if (classificationTask?.isCancelled == false && classificationTask?.isDone == false) return true
    if (!hasModelAsset() || !isRecordAudioDeclared()) return false
    if (ContextCompat.checkSelfPermission(context, Manifest.permission.RECORD_AUDIO) != PackageManager.PERMISSION_GRANTED) return false

    return try {
      val localClassifier = AudioClassifier.createFromFile(context, MODEL_ASSET)
      val localTensor = localClassifier.createInputTensorAudio()
      val localRecorder = localClassifier.createAudioRecord()
      localRecorder.startRecording()
      val localExecutor = ScheduledThreadPoolExecutor(1)
      val task = localExecutor.scheduleAtFixedRate({
        try {
          localTensor.load(localRecorder)
          val results = localClassifier.classify(localTensor)
          val top = results
            .flatMap { it.categories }
            .filter { it.score >= SCORE_THRESHOLD }
            .maxByOrNull { it.score }
          if (top != null) {
            sendEvent(
              "onSoundClassification",
              bundleOf(
                "label" to top.label,
                "confidence" to top.score.toDouble(),
                "timestampMs" to System.currentTimeMillis().toDouble()
              )
            )
          }
        } catch (_: Exception) {
          // Keep the local listener resilient; a transient inference error must not upload or persist room audio.
        }
      }, 0, CLASSIFY_INTERVAL_MS, TimeUnit.MILLISECONDS)

      classifier = localClassifier
      tensorAudio = localTensor
      recorder = localRecorder
      executor = localExecutor
      classificationTask = task
      true
    } catch (_: Exception) {
      stopAnalysis()
      false
    }
  }

  private fun stopAnalysis() {
    classificationTask?.cancel(true)
    classificationTask = null
    executor?.shutdownNow()
    executor = null
    try { recorder?.stop() } catch (_: Exception) {}
    recorder?.release()
    recorder = null
    tensorAudio = null
    classifier?.close()
    classifier = null
  }

  override fun onInit(status: Int) {
    ttsReady = status == TextToSpeech.SUCCESS
    if (!ttsReady) return
    tts?.setOnUtteranceProgressListener(object : UtteranceProgressListener() {
      override fun onStart(utteranceId: String) {
        this@LiaSoundAnalysisModule.sendEvent("onSpeechState", bundleOf("utteranceId" to utteranceId, "state" to "start"))
      }
      override fun onDone(utteranceId: String) {
        this@LiaSoundAnalysisModule.sendEvent("onSpeechState", bundleOf("utteranceId" to utteranceId, "state" to "done"))
      }
      @Deprecated("Deprecated in Java")
      override fun onError(utteranceId: String) {
        this@LiaSoundAnalysisModule.sendEvent("onSpeechState", bundleOf("utteranceId" to utteranceId, "state" to "error"))
      }
      override fun onStop(utteranceId: String, interrupted: Boolean) {
        this@LiaSoundAnalysisModule.sendEvent("onSpeechState", bundleOf("utteranceId" to utteranceId, "state" to "stopped"))
      }
    })
  }
}
