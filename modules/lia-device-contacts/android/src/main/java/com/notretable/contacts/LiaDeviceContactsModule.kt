package com.notretable.contacts

import android.Manifest
import android.content.Intent
import android.content.pm.PackageManager
import android.net.Uri
import android.provider.ContactsContract
import androidx.core.content.ContextCompat
import expo.modules.interfaces.permissions.PermissionsStatus
import expo.modules.kotlin.Promise
import expo.modules.kotlin.exception.Exceptions
import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition

class LiaDeviceContactsModule : Module() {
  private val context get() = appContext.reactContext ?: throw Exceptions.ReactContextLost()

  override fun definition() = ModuleDefinition {
    Name("LiaDeviceContacts")

    Function("isAvailable") { true }
    Function("permissionStatus") {
      if (ContextCompat.checkSelfPermission(context, Manifest.permission.READ_CONTACTS) == PackageManager.PERMISSION_GRANTED) "granted" else "undetermined"
    }
    AsyncFunction("requestPermission") { promise: Promise ->
      val manager = appContext.permissions
      if (manager == null) { promise.resolve(false); return@AsyncFunction }
      manager.askForPermissions({ response ->
        promise.resolve(response[Manifest.permission.READ_CONTACTS]?.status == PermissionsStatus.GRANTED)
      }, Manifest.permission.READ_CONTACTS)
    }
    AsyncFunction("searchContacts") { query: String ->
      if (ContextCompat.checkSelfPermission(context, Manifest.permission.READ_CONTACTS) != PackageManager.PERMISSION_GRANTED) return@AsyncFunction emptyList<Map<String, Any?>>()
      val clean = query.trim()
      if (clean.isEmpty()) return@AsyncFunction emptyList<Map<String, Any?>>()
      val uri = ContactsContract.CommonDataKinds.Phone.CONTENT_URI
      val projection = arrayOf(
        ContactsContract.CommonDataKinds.Phone.CONTACT_ID,
        ContactsContract.CommonDataKinds.Phone.DISPLAY_NAME,
        ContactsContract.CommonDataKinds.Phone.NUMBER,
        ContactsContract.CommonDataKinds.Phone.TYPE,
        ContactsContract.CommonDataKinds.Phone.LABEL
      )
      val selection = "${ContactsContract.CommonDataKinds.Phone.DISPLAY_NAME} LIKE ?"
      val cursor = context.contentResolver.query(uri, projection, selection, arrayOf("%$clean%"), null)
      val grouped = linkedMapOf<String, MutableMap<String, Any?>>()
      cursor?.use { c ->
        val idIndex=c.getColumnIndexOrThrow(ContactsContract.CommonDataKinds.Phone.CONTACT_ID)
        val nameIndex=c.getColumnIndexOrThrow(ContactsContract.CommonDataKinds.Phone.DISPLAY_NAME)
        val numberIndex=c.getColumnIndexOrThrow(ContactsContract.CommonDataKinds.Phone.NUMBER)
        val typeIndex=c.getColumnIndexOrThrow(ContactsContract.CommonDataKinds.Phone.TYPE)
        val labelIndex=c.getColumnIndexOrThrow(ContactsContract.CommonDataKinds.Phone.LABEL)
        while(c.moveToNext()){
          val id=c.getString(idIndex)
          val name=c.getString(nameIndex) ?: ""
          val number=c.getString(numberIndex) ?: ""
          val type=c.getInt(typeIndex)
          val customLabel=c.getString(labelIndex)
          val label=ContactsContract.CommonDataKinds.Phone.getTypeLabel(context.resources,type,customLabel)?.toString()
          val item=grouped.getOrPut(id){mutableMapOf("id" to id,"displayName" to name,"phoneNumbers" to mutableListOf<Map<String,String?>>())}
          @Suppress("UNCHECKED_CAST")
          val phones=item["phoneNumbers"] as MutableList<Map<String,String?>>
          phones.add(mapOf("label" to label,"number" to number))
        }
      }
      grouped.values.toList()
    }
    Function("isMessageComposerAvailable") {
      val intent=Intent(Intent.ACTION_SENDTO,Uri.parse("smsto:"))
      intent.resolveActivity(context.packageManager)!=null
    }
    AsyncFunction("composeMessage") { request: Map<String, Any?> ->
      @Suppress("UNCHECKED_CAST")
      val recipients=(request["recipients"] as? List<String>).orEmpty().filter{it.isNotBlank()}
      val body=(request["body"] as? String).orEmpty().trim()
      if(recipients.isEmpty()||body.isEmpty())return@AsyncFunction false
      val intent=Intent(Intent.ACTION_SENDTO,Uri.parse("smsto:${recipients.joinToString(";")}"))
      intent.putExtra("sms_body",body)
      intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
      if(intent.resolveActivity(context.packageManager)==null)return@AsyncFunction false
      context.startActivity(intent)
      true
    }
  }
}
