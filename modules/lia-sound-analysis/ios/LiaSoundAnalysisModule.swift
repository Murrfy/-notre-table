import AVFoundation
import CallKit
import ExpoModulesCore
import ShazamKit
import SoundAnalysis
import Speech

private final class LiaSoundObserver: NSObject, SNResultsObserving {
  let onResult: (String, Double, Double) -> Void
  init(onResult: @escaping (String, Double, Double) -> Void) { self.onResult = onResult }
  func request(_ request: SNRequest, didProduce result: SNResult) {
    guard let classification = result as? SNClassificationResult,
          let best = classification.classifications.first else { return }
    onResult(best.identifier, Double(best.confidence), CMTimeGetSeconds(classification.timeRange.start) * 1000.0)
  }
  func request(_ request: SNRequest, didFailWithError error: Error) {}
  func requestDidComplete(_ request: SNRequest) {}
}


private final class LiaCallObserverDelegate: NSObject, CXCallObserverDelegate {
  let onChange: () -> Void
  init(onChange: @escaping () -> Void) { self.onChange = onChange }
  func callObserver(_ callObserver: CXCallObserver, callChanged call: CXCall) { onChange() }
}

private final class LiaSpeechDelegate: NSObject, AVSpeechSynthesizerDelegate {
  var currentUtteranceId: String = ""
  var onState: ((String, String) -> Void)?
  func speechSynthesizer(_ synthesizer: AVSpeechSynthesizer, didStart utterance: AVSpeechUtterance) { onState?(currentUtteranceId, "start") }
  func speechSynthesizer(_ synthesizer: AVSpeechSynthesizer, didFinish utterance: AVSpeechUtterance) { onState?(currentUtteranceId, "done") }
  func speechSynthesizer(_ synthesizer: AVSpeechSynthesizer, didCancel utterance: AVSpeechUtterance) { onState?(currentUtteranceId, "stopped") }
}

private final class LiaShazamDelegate: NSObject, SHSessionDelegate {
  let onMatch: (SHMediaItem) -> Void
  let onFailure: (String) -> Void
  init(onMatch: @escaping (SHMediaItem) -> Void, onFailure: @escaping (String) -> Void) {
    self.onMatch = onMatch
    self.onFailure = onFailure
  }
  func session(_ session: SHSession, didFind match: SHMatch) {
    guard let mediaItem = match.mediaItems.first else { return }
    onMatch(mediaItem)
  }
  func session(_ session: SHSession, didNotFindMatchFor signature: SHSignature, error: Error?) {
    if let error { onFailure(error.localizedDescription) }
  }
}

public class LiaSoundAnalysisModule: Module {
  private var audioEngine: AVAudioEngine?
  private var analyzer: SNAudioStreamAnalyzer?
  private var request: SNClassifySoundRequest?
  private var observer: LiaSoundObserver?
  private let synthesizer = AVSpeechSynthesizer()
  private let speechDelegate = LiaSpeechDelegate()

  private var recognitionEngine: AVAudioEngine?
  private var recognitionRequest: SFSpeechAudioBufferRecognitionRequest?
  private var recognitionTask: SFSpeechRecognitionTask?
  private var speechRecognizer: SFSpeechRecognizer?

  private var foregroundAssistantEnabled = false
  private var foregroundSpeechRecognizer: SFSpeechRecognizer?
  private var foregroundRecognitionRequest: SFSpeechAudioBufferRecognitionRequest?
  private var foregroundRecognitionTask: SFSpeechRecognitionTask?
  private var foregroundLanguageTag = "fr-FR"
  private var foregroundRestartWorkItem: DispatchWorkItem?

  private var musicRecognitionEnabled = false
  private var shazamSession: SHSession?
  private var shazamDelegate: LiaShazamDelegate?
  private var lastMusicMatchKey: String?
  private var lastMusicMatchAtMs: Double = 0
  private var lastMusicTitle = ""
  private var lastMusicArtist = ""
  private var soundAnalysisRequested = false
  private var lastAudioRuntimeReason = "created"
  private var lastInterruptionState = "none"
  private var lastResumeResult = "not_attempted"
  private var lastShazamError = ""
  private var interruptionObserver: NSObjectProtocol?
  private var mediaResetObserver: NSObjectProtocol?
  private let callObserver = CXCallObserver()
  private var callObserverDelegate: LiaCallObserverDelegate?
  private var systemCallActive = false
  private var activeSystemCallCount = 0
  private var systemCallState = "none"
  private var resumeSpeechRecognitionAfterCall = false
  private var lastSpeechRecognitionLanguageTag = "fr-FR"

  public func definition() -> ModuleDefinition {
    Name("LiaSoundAnalysis")
    Events("onSoundClassification", "onSpeechState", "onSpeechTranscript", "onForegroundSpeechTranscript", "onMusicRecognition", "onAudioRuntimeState")

    OnCreate {
      self.speechDelegate.onState = { [weak self] utteranceId, state in
        guard let self else { return }
        self.sendEvent("onSpeechState", ["utteranceId": utteranceId, "state": state])
        if state == "start" {
          self.stopForegroundSpeechRecognition(keepEnabled: true)
        } else if state == "done" || state == "stopped" || state == "error" {
          self.scheduleForegroundRecognitionRestart(afterMs: 180)
        }
      }
      self.synthesizer.delegate = self.speechDelegate
      self.installAudioSessionObservers()
      self.installSystemCallObserver()
      self.emitAudioRuntimeState(reason: "created")
    }

    Function("audioRuntimeStatus") { () -> [String: Any] in
      self.audioRuntimeStatus()
    }

    Function("isSoundAnalysisAvailable") { () -> Bool in
      if #available(iOS 15.0, *) { return true }
      return false
    }

    Function("isMusicRecognitionAvailable") { () -> Bool in
      if #available(iOS 15.0, *) { return true }
      return false
    }

    Function("microphonePermissionStatus") { () -> String in
      switch AVAudioSession.sharedInstance().recordPermission {
      case .granted: return "granted"
      case .denied: return "denied"
      case .undetermined: return "undetermined"
      @unknown default: return "unknown"
      }
    }

    AsyncFunction("requestMicrophonePermission") { (promise: Promise) in
      AVAudioSession.sharedInstance().requestRecordPermission { granted in promise.resolve(granted) }
    }

    AsyncFunction("startSoundAnalysis") { () -> Bool in
      self.soundAnalysisRequested = true
      if self.systemCallActive {
        self.lastResumeResult = "blocked_by_call"
        self.emitAudioRuntimeState(reason: "analysis_waiting_for_call_end")
        return false
      }
      self.stopRecognition(restartAnalysis: false)
      let started = try self.startAnalysis()
      self.lastResumeResult = started ? "running" : "failed"
      self.emitAudioRuntimeState(reason: "analysis_start_requested")
      return started
    }.runOnQueue(.main)
    AsyncFunction("stopSoundAnalysis") {
      self.soundAnalysisRequested = false
      self.stopAnalysis()
      self.emitAudioRuntimeState(reason: "analysis_stopped")
    }.runOnQueue(.main)

    AsyncFunction("startMusicRecognition") { () -> Bool in
      guard #available(iOS 15.0, *) else { return false }
      guard AVAudioSession.sharedInstance().recordPermission == .granted else { return false }
      self.musicRecognitionEnabled = true
      self.lastShazamError = ""
      if self.systemCallActive {
        self.lastResumeResult = "blocked_by_call"
        self.emitAudioRuntimeState(reason: "music_recognition_waiting_for_call_end")
        return false
      }
      self.ensureShazamSession()
      if self.audioEngine?.isRunning == true {
        self.emitAudioRuntimeState(reason: "music_recognition_enabled")
        return true
      }
      self.stopRecognition(restartAnalysis: false)
      let started = try self.startAnalysis()
      self.emitAudioRuntimeState(reason: "music_recognition_start_requested")
      return started
    }.runOnQueue(.main)

    AsyncFunction("stopMusicRecognition") {
      self.musicRecognitionEnabled = false
      self.shazamSession = nil
      self.shazamDelegate = nil
      self.lastMusicMatchKey = nil
      self.lastMusicMatchAtMs = 0
      self.lastShazamError = ""
      self.emitAudioRuntimeState(reason: "music_recognition_stopped")
    }.runOnQueue(.main)

    Function("isSpeechRecognitionAvailable") { () -> Bool in
      return SFSpeechRecognizer()?.isAvailable ?? false
    }

    Function("speechRecognitionPermissionStatus") { () -> String in
      switch SFSpeechRecognizer.authorizationStatus() {
      case .authorized: return "granted"
      case .denied, .restricted: return "denied"
      case .notDetermined: return "undetermined"
      @unknown default: return "unknown"
      }
    }

    AsyncFunction("requestSpeechRecognitionPermission") { (promise: Promise) in
      SFSpeechRecognizer.requestAuthorization { status in
        promise.resolve(status == .authorized)
      }
    }

    AsyncFunction("startSpeechRecognition") { (languageTag: String) -> Bool in
      if self.systemCallActive {
        self.lastResumeResult = "blocked_by_call"
        self.emitAudioRuntimeState(reason: "speech_recognition_blocked_by_call")
        return false
      }
      self.lastSpeechRecognitionLanguageTag = languageTag
      self.stopAnalysis()
      return try self.startRecognition(languageTag: languageTag)
    }.runOnQueue(.main)

    AsyncFunction("stopSpeechRecognition") {
      self.stopRecognition(restartAnalysis: true)
    }.runOnQueue(.main)

    Function("isForegroundAssistantAvailable") { () -> Bool in
      guard SFSpeechRecognizer.authorizationStatus() != .restricted else { return false }
      return SFSpeechRecognizer(locale: Locale(identifier: self.foregroundLanguageTag))?.isAvailable ?? false
    }

    AsyncFunction("startForegroundAssistant") { (languageTag: String) -> Bool in
      self.foregroundAssistantEnabled = true
      self.foregroundLanguageTag = languageTag
      self.soundAnalysisRequested = true
      if self.systemCallActive {
        self.lastResumeResult = "foreground_assistant_waiting_for_call_end"
        self.emitAudioRuntimeState(reason: "foreground_assistant_waiting_for_call_end")
        return false
      }
      guard AVAudioSession.sharedInstance().recordPermission == .granted else { return false }
      guard SFSpeechRecognizer.authorizationStatus() == .authorized else { return false }
      if self.audioEngine?.isRunning != true {
        let started = try self.startAnalysis()
        if !started { return false }
      } else {
        self.ensureForegroundSpeechRecognition()
      }
      self.lastResumeResult = "foreground_assistant_running"
      self.emitAudioRuntimeState(reason: "foreground_assistant_started")
      return true
    }.runOnQueue(.main)

    AsyncFunction("stopForegroundAssistant") {
      self.foregroundAssistantEnabled = false
      self.stopForegroundSpeechRecognition(keepEnabled: false)
      self.emitAudioRuntimeState(reason: "foreground_assistant_stopped")
    }.runOnQueue(.main)

    Function("getVoices") { () -> [[String: String]] in
      AVSpeechSynthesisVoice.speechVoices().map { voice in
        ["identifier": voice.identifier, "name": voice.name, "language": voice.language, "quality": voice.quality == .enhanced ? "Enhanced" : "Default"]
      }
    }

    AsyncFunction("speak") { (text: String, languageTag: String, voiceIdentifier: String?, utteranceId: String) -> Bool in
      if self.systemCallActive {
        self.lastResumeResult = "speech_blocked_by_call"
        self.emitAudioRuntimeState(reason: "speech_blocked_by_call")
        return false
      }
      try self.configurePlaybackSession()
      if self.synthesizer.isSpeaking { self.synthesizer.stopSpeaking(at: .immediate) }
      let utterance = AVSpeechUtterance(string: text)
      if let identifier = voiceIdentifier, let voice = AVSpeechSynthesisVoice.speechVoices().first(where: { $0.identifier == identifier }) { utterance.voice = voice }
      else { utterance.voice = AVSpeechSynthesisVoice(language: languageTag) }
      utterance.rate = 0.48
      utterance.pitchMultiplier = 1.0
      utterance.volume = 1.0
      self.speechDelegate.currentUtteranceId = utteranceId
      self.synthesizer.speak(utterance)
      return true
    }.runOnQueue(.main)

    AsyncFunction("stopSpeech") { self.synthesizer.stopSpeaking(at: .immediate) }.runOnQueue(.main)

    OnDestroy {
      self.removeAudioSessionObservers()
      self.removeSystemCallObserver()
      self.soundAnalysisRequested = false
      self.musicRecognitionEnabled = false
      self.shazamSession = nil
      self.shazamDelegate = nil
      self.foregroundAssistantEnabled = false
      self.stopForegroundSpeechRecognition(keepEnabled: false)
      self.stopAnalysis()
      self.stopRecognition(restartAnalysis: false)
      self.synthesizer.stopSpeaking(at: .immediate)
    }
  }


  private func audioRuntimeStatus() -> [String: Any] {
    let session = AVAudioSession.sharedInstance()
    return [
      "microphonePermission": self.microphonePermissionLabel(),
      "analysisRequested": self.soundAnalysisRequested,
      "audioEngineRunning": self.audioEngine?.isRunning == true,
      "musicRecognitionEnabled": self.musicRecognitionEnabled,
      "shazamSessionReady": self.shazamSession != nil,
      "speechRecognitionRunning": self.recognitionEngine?.isRunning == true,
      "foregroundAssistantEnabled": self.foregroundAssistantEnabled,
      "foregroundSpeechRecognitionRunning": self.foregroundRecognitionTask != nil,
      "systemCallActive": self.systemCallActive,
      "activeSystemCallCount": self.activeSystemCallCount,
      "systemCallState": self.systemCallState,
      "audioSessionCategory": session.category.rawValue,
      "audioSessionMode": session.mode.rawValue,
      "lastInterruption": self.lastInterruptionState,
      "lastResumeResult": self.lastResumeResult,
      "lastShazamError": self.lastShazamError,
      "lastMusicTitle": self.lastMusicTitle,
      "lastMusicArtist": self.lastMusicArtist,
      "reason": self.lastAudioRuntimeReason,
      "updatedAtMs": Date().timeIntervalSince1970 * 1000.0,
    ]
  }

  private func microphonePermissionLabel() -> String {
    switch AVAudioSession.sharedInstance().recordPermission {
    case .granted: return "granted"
    case .denied: return "denied"
    case .undetermined: return "undetermined"
    @unknown default: return "unknown"
    }
  }

  private func emitAudioRuntimeState(reason: String) {
    self.lastAudioRuntimeReason = reason
    sendEvent("onAudioRuntimeState", self.audioRuntimeStatus())
  }

  private func installAudioSessionObservers() {
    guard self.interruptionObserver == nil else { return }
    self.interruptionObserver = NotificationCenter.default.addObserver(
      forName: AVAudioSession.interruptionNotification,
      object: AVAudioSession.sharedInstance(),
      queue: .main
    ) { [weak self] notification in
      self?.handleAudioSessionInterruption(notification)
    }
    self.mediaResetObserver = NotificationCenter.default.addObserver(
      forName: AVAudioSession.mediaServicesWereResetNotification,
      object: AVAudioSession.sharedInstance(),
      queue: .main
    ) { [weak self] _ in
      guard let self else { return }
      self.lastInterruptionState = "media_services_reset"
      self.resumeRequestedAudio(reason: "media_services_reset")
    }
  }

  private func removeAudioSessionObservers() {
    if let observer = self.interruptionObserver { NotificationCenter.default.removeObserver(observer) }
    if let observer = self.mediaResetObserver { NotificationCenter.default.removeObserver(observer) }
    self.interruptionObserver = nil
    self.mediaResetObserver = nil
  }

  private func installSystemCallObserver() {
    guard self.callObserverDelegate == nil else { return }
    let delegate = LiaCallObserverDelegate { [weak self] in
      DispatchQueue.main.async { self?.refreshSystemCallState(reason: "call_state_changed") }
    }
    self.callObserverDelegate = delegate
    self.callObserver.setDelegate(delegate, queue: .main)
    self.refreshSystemCallState(reason: "call_observer_ready")
  }

  private func removeSystemCallObserver() {
    self.callObserver.setDelegate(nil, queue: nil)
    self.callObserverDelegate = nil
  }

  private func refreshSystemCallState(reason: String) {
    let activeCalls = self.callObserver.calls.filter { !$0.hasEnded }
    let wasActive = self.systemCallActive
    self.activeSystemCallCount = activeCalls.count
    self.systemCallActive = !activeCalls.isEmpty
    if let connected = activeCalls.first(where: { $0.hasConnected }) {
      self.systemCallState = connected.isOnHold ? "on_hold" : "connected"
    } else if activeCalls.contains(where: { $0.isOutgoing }) {
      self.systemCallState = "outgoing_connecting"
    } else if !activeCalls.isEmpty {
      self.systemCallState = "incoming_ringing"
    } else {
      self.systemCallState = "none"
    }

    if self.systemCallActive {
      if !wasActive { self.suspendForSystemCall(reason: reason) }
      else { self.emitAudioRuntimeState(reason: reason) }
      return
    }

    if wasActive {
      self.lastInterruptionState = "call_ended"
      self.resumeAfterSystemCall(reason: "call_ended")
    } else {
      self.emitAudioRuntimeState(reason: reason)
    }
  }

  private func suspendForSystemCall(reason: String) {
    self.resumeSpeechRecognitionAfterCall = self.resumeSpeechRecognitionAfterCall || self.recognitionEngine?.isRunning == true
    self.stopForegroundSpeechRecognition(keepEnabled: true)
    self.stopAnalysis()
    self.stopRecognition(restartAnalysis: false)
    if self.synthesizer.isSpeaking { self.synthesizer.stopSpeaking(at: .immediate) }
    try? AVAudioSession.sharedInstance().setActive(false, options: .notifyOthersOnDeactivation)
    self.lastInterruptionState = "call_active"
    self.lastResumeResult = "suspended_for_call"
    self.emitAudioRuntimeState(reason: reason)
  }

  private func resumeAfterSystemCall(reason: String) {
    guard !self.systemCallActive else {
      self.lastResumeResult = "blocked_by_call"
      self.emitAudioRuntimeState(reason: reason)
      return
    }
    if self.resumeSpeechRecognitionAfterCall {
      self.resumeSpeechRecognitionAfterCall = false
      do {
        let resumed = try self.startRecognition(languageTag: self.lastSpeechRecognitionLanguageTag)
        self.lastResumeResult = resumed ? "speech_recognition_resumed" : "failed"
      } catch {
        self.lastResumeResult = "failed"
        self.lastShazamError = error.localizedDescription
      }
      self.emitAudioRuntimeState(reason: reason)
      return
    }
    self.resumeRequestedAudio(reason: reason)
  }

  private func handleAudioSessionInterruption(_ notification: Notification) {
    guard let value = notification.userInfo?[AVAudioSessionInterruptionTypeKey] as? UInt,
          let type = AVAudioSession.InterruptionType(rawValue: value) else { return }
    switch type {
    case .began:
      self.lastInterruptionState = self.systemCallActive ? "call_active" : "began"
      self.lastResumeResult = self.systemCallActive ? "suspended_for_call" : "pending"
      if self.systemCallActive { self.suspendForSystemCall(reason: "interruption_began_during_call") }
      else { self.emitAudioRuntimeState(reason: "interruption_began") }
    case .ended:
      let callWasActive = self.systemCallActive
      self.refreshSystemCallState(reason: "interruption_ended_state_check")
      if callWasActive && !self.systemCallActive { return }
      if self.systemCallActive {
        self.lastInterruptionState = "call_active"
        self.lastResumeResult = "blocked_by_call"
        self.emitAudioRuntimeState(reason: "interruption_ended_but_call_active")
        return
      }
      let rawOptions = notification.userInfo?[AVAudioSessionInterruptionOptionKey] as? UInt ?? 0
      let options = AVAudioSession.InterruptionOptions(rawValue: rawOptions)
      self.lastInterruptionState = options.contains(.shouldResume) ? "ended_should_resume" : "ended_no_resume"
      if options.contains(.shouldResume) {
        self.resumeRequestedAudio(reason: "interruption_ended")
      } else {
        self.lastResumeResult = "system_did_not_recommend_resume"
        self.emitAudioRuntimeState(reason: "interruption_ended_without_resume")
      }
    @unknown default:
      self.lastInterruptionState = "unknown"
      self.emitAudioRuntimeState(reason: "interruption_unknown")
    }
  }

  private func resumeRequestedAudio(reason: String) {
    guard !self.systemCallActive else {
      self.lastResumeResult = "blocked_by_call"
      self.emitAudioRuntimeState(reason: reason)
      return
    }
    guard self.soundAnalysisRequested || self.musicRecognitionEnabled || self.foregroundAssistantEnabled else {
      self.lastResumeResult = "not_requested"
      self.emitAudioRuntimeState(reason: reason)
      return
    }
    self.stopAnalysis()
    do {
      let resumed = try self.startAnalysis()
      self.lastResumeResult = resumed ? "resumed" : "failed"
    } catch {
      self.lastResumeResult = "failed"
      self.lastShazamError = error.localizedDescription
    }
    self.emitAudioRuntimeState(reason: reason)
  }

  private func configurePlaybackSession() throws {
    let session = AVAudioSession.sharedInstance()
    let listening = audioEngine?.isRunning == true || recognitionEngine?.isRunning == true
    let options: AVAudioSession.CategoryOptions = listening ? [.defaultToSpeaker, .allowBluetooth, .mixWithOthers] : [.defaultToSpeaker]
    try session.setCategory(listening ? .playAndRecord : .playback, mode: .spokenAudio, options: options)
    try session.setActive(true)
  }

  @available(iOS 15.0, *)
  private func makeRequest() throws -> SNClassifySoundRequest {
    let request = try SNClassifySoundRequest(classifierIdentifier: .version1)
    request.overlapFactor = 0.5
    return request
  }

  private func ensureShazamSession() {
    guard #available(iOS 15.0, *), musicRecognitionEnabled else { return }
    if shazamSession != nil { return }
    let session = SHSession()
    let delegate = LiaShazamDelegate(onMatch: { [weak self] mediaItem in
      self?.emitMusicMatch(mediaItem)
    }, onFailure: { [weak self] message in
      guard let self else { return }
      self.lastShazamError = message
      self.emitAudioRuntimeState(reason: "shazam_error")
    })
    session.delegate = delegate
    shazamSession = session
    shazamDelegate = delegate
  }

  private func emitMusicMatch(_ mediaItem: SHMediaItem) {
    let title = mediaItem.title?.trimmingCharacters(in: .whitespacesAndNewlines) ?? ""
    let artist = mediaItem.artist?.trimmingCharacters(in: .whitespacesAndNewlines) ?? ""
    guard !title.isEmpty || !artist.isEmpty else { return }
    let key = mediaItem.shazamID ?? "\(artist.lowercased())|\(title.lowercased())"
    let nowMs = Date().timeIntervalSince1970 * 1000.0
    if lastMusicMatchKey == key && nowMs - lastMusicMatchAtMs < 12_000 { return }
    lastMusicMatchKey = key
    lastMusicMatchAtMs = nowMs
    self.lastMusicTitle = title
    self.lastMusicArtist = artist
    self.lastShazamError = ""
    self.emitAudioRuntimeState(reason: "music_match")
    sendEvent("onMusicRecognition", [
      "title": title,
      "artist": artist,
      "identifier": mediaItem.shazamID ?? mediaItem.id.uuidString,
      "appleMusicURL": mediaItem.appleMusicURL?.absoluteString ?? "",
      "webURL": mediaItem.webURL?.absoluteString ?? "",
      "matchedAtMs": nowMs,
    ])
  }

  private func startAnalysis() throws -> Bool {
    if self.systemCallActive { return false }
    if audioEngine?.isRunning == true { return true }
    guard #available(iOS 15.0, *) else { return false }
    guard AVAudioSession.sharedInstance().recordPermission == .granted else { return false }

    if musicRecognitionEnabled { ensureShazamSession() }
    let session = AVAudioSession.sharedInstance()
    try session.setCategory(.playAndRecord, mode: .measurement, options: [.defaultToSpeaker, .allowBluetooth, .mixWithOthers])
    try session.setActive(true)
    let engine = AVAudioEngine()
    let input = engine.inputNode
    let format = input.outputFormat(forBus: 0)
    let analyzer = SNAudioStreamAnalyzer(format: format)
    let request = try makeRequest()
    let observer = LiaSoundObserver { [weak self] label, confidence, timestampMs in
      self?.sendEvent("onSoundClassification", ["label": label, "confidence": confidence, "timestampMs": timestampMs])
    }
    try analyzer.add(request, withObserver: observer)
    self.ensureForegroundSpeechRecognition()
    input.installTap(onBus: 0, bufferSize: 4096, format: format) { [weak self] buffer, when in
      analyzer.analyze(buffer, atAudioFramePosition: when.sampleTime)
      if self?.musicRecognitionEnabled == true { self?.shazamSession?.matchStreamingBuffer(buffer, at: when) }
      if self?.foregroundAssistantEnabled == true && self?.synthesizer.isSpeaking != true {
        self?.foregroundRecognitionRequest?.append(buffer)
      }
    }
    engine.prepare()
    try engine.start()
    self.audioEngine = engine; self.analyzer = analyzer; self.request = request; self.observer = observer
    return true
  }

  private func stopAnalysis() {
    self.stopForegroundSpeechRecognition(keepEnabled: true)
    if let engine = audioEngine {
      if engine.inputNode.numberOfInputs > 0 { engine.inputNode.removeTap(onBus: 0) }
      engine.stop()
    }
    analyzer?.removeAllRequests()
    audioEngine = nil; analyzer = nil; request = nil; observer = nil
  }

  private func ensureForegroundSpeechRecognition() {
    guard self.foregroundAssistantEnabled, !self.systemCallActive, !self.synthesizer.isSpeaking else { return }
    guard self.foregroundRecognitionTask == nil else { return }
    guard AVAudioSession.sharedInstance().recordPermission == .granted else { return }
    guard SFSpeechRecognizer.authorizationStatus() == .authorized else { return }
    guard let recognizer = SFSpeechRecognizer(locale: Locale(identifier: self.foregroundLanguageTag)), recognizer.isAvailable else { return }

    let request = SFSpeechAudioBufferRecognitionRequest()
    request.shouldReportPartialResults = true
    request.taskHint = .dictation
    self.foregroundSpeechRecognizer = recognizer
    self.foregroundRecognitionRequest = request
    self.foregroundRecognitionTask = recognizer.recognitionTask(with: request) { [weak self] result, error in
      guard let self else { return }
      if let result {
        self.sendEvent("onForegroundSpeechTranscript", ["text": result.bestTranscription.formattedString, "isFinal": result.isFinal])
        if result.isFinal { self.scheduleForegroundRecognitionRestart(afterMs: 160) }
      } else if error != nil {
        self.scheduleForegroundRecognitionRestart(afterMs: 420)
      }
    }
    self.emitAudioRuntimeState(reason: "foreground_speech_started")
  }

  private func stopForegroundSpeechRecognition(keepEnabled: Bool) {
    self.foregroundRestartWorkItem?.cancel()
    self.foregroundRestartWorkItem = nil
    self.foregroundRecognitionRequest?.endAudio()
    self.foregroundRecognitionTask?.cancel()
    self.foregroundRecognitionTask = nil
    self.foregroundRecognitionRequest = nil
    self.foregroundSpeechRecognizer = nil
    if !keepEnabled { self.foregroundAssistantEnabled = false }
  }

  private func scheduleForegroundRecognitionRestart(afterMs: Int) {
    guard self.foregroundAssistantEnabled, !self.systemCallActive else { return }
    self.foregroundRestartWorkItem?.cancel()
    let item = DispatchWorkItem { [weak self] in
      guard let self, self.foregroundAssistantEnabled, !self.systemCallActive, self.audioEngine?.isRunning == true, !self.synthesizer.isSpeaking else { return }
      self.stopForegroundSpeechRecognition(keepEnabled: true)
      self.ensureForegroundSpeechRecognition()
    }
    self.foregroundRestartWorkItem = item
    DispatchQueue.main.asyncAfter(deadline: .now() + .milliseconds(afterMs), execute: item)
  }

  private func startRecognition(languageTag: String) throws -> Bool {
    if self.systemCallActive { return false }
    self.lastSpeechRecognitionLanguageTag = languageTag
    if recognitionEngine?.isRunning == true { return true }
    guard AVAudioSession.sharedInstance().recordPermission == .granted else { return false }
    guard SFSpeechRecognizer.authorizationStatus() == .authorized else { return false }
    guard let recognizer = SFSpeechRecognizer(locale: Locale(identifier: languageTag)), recognizer.isAvailable else { return false }

    stopRecognition(restartAnalysis: false)
    let session = AVAudioSession.sharedInstance()
    try session.setCategory(.record, mode: .measurement, options: [.duckOthers])
    try session.setActive(true, options: .notifyOthersOnDeactivation)

    let engine = AVAudioEngine()
    let input = engine.inputNode
    let format = input.outputFormat(forBus: 0)
    let request = SFSpeechAudioBufferRecognitionRequest()
    request.shouldReportPartialResults = true
    input.installTap(onBus: 0, bufferSize: 1024, format: format) { buffer, _ in
      request.append(buffer)
    }

    recognitionTask = recognizer.recognitionTask(with: request) { [weak self] result, error in
      if let result = result {
        self?.sendEvent("onSpeechTranscript", ["text": result.bestTranscription.formattedString, "isFinal": result.isFinal])
        if result.isFinal { self?.stopRecognition(restartAnalysis: true) }
      } else if error != nil {
        self?.stopRecognition(restartAnalysis: true)
      }
    }
    engine.prepare()
    try engine.start()
    recognitionEngine = engine
    recognitionRequest = request
    speechRecognizer = recognizer
    return true
  }

  private func stopRecognition(restartAnalysis: Bool) {
    recognitionRequest?.endAudio()
    recognitionTask?.cancel()
    recognitionTask = nil
    recognitionRequest = nil
    speechRecognizer = nil
    if let engine = recognitionEngine {
      if engine.inputNode.numberOfInputs > 0 { engine.inputNode.removeTap(onBus: 0) }
      engine.stop()
    }
    recognitionEngine = nil
    if restartAnalysis && (musicRecognitionEnabled || soundAnalysisRequested) && audioEngine?.isRunning != true && !systemCallActive {
      try? startAnalysis()
    }
  }
}
