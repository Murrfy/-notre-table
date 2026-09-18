import Contacts
import MessageUI
import ExpoModulesCore

public class LiaDeviceContactsModule: Module, MFMessageComposeViewControllerDelegate {
  private let store = CNContactStore()

  public func definition() -> ModuleDefinition {
    Name("LiaDeviceContacts")

    Function("isAvailable") { () -> Bool in true }

    Function("permissionStatus") { () -> String in
      switch CNContactStore.authorizationStatus(for: .contacts) {
      case .authorized: return "granted"
      case .denied, .restricted: return "denied"
      case .notDetermined: return "undetermined"
      @unknown default: return "unknown"
      }
    }

    AsyncFunction("requestPermission") { (promise: Promise) in
      self.store.requestAccess(for: .contacts) { granted, _ in promise.resolve(granted) }
    }

    AsyncFunction("searchContacts") { (query: String) -> [[String: Any]] in
      guard CNContactStore.authorizationStatus(for: .contacts) == .authorized else { return [] }
      let clean = query.trimmingCharacters(in: .whitespacesAndNewlines)
      guard !clean.isEmpty else { return [] }
      let keys: [CNKeyDescriptor] = [
        CNContactIdentifierKey as CNKeyDescriptor,
        CNContactGivenNameKey as CNKeyDescriptor,
        CNContactFamilyNameKey as CNKeyDescriptor,
        CNContactOrganizationNameKey as CNKeyDescriptor,
        CNContactPhoneNumbersKey as CNKeyDescriptor
      ]
      let contacts = try self.store.unifiedContacts(matching: CNContact.predicateForContacts(matchingName: clean), keysToFetch: keys)
      return contacts.map { contact in
        let personName = [contact.givenName, contact.familyName].filter { !$0.isEmpty }.joined(separator: " ")
        let displayName = personName.isEmpty ? contact.organizationName : personName
        let phones = contact.phoneNumbers.map { value -> [String: Any] in
          let label = value.label.flatMap { CNLabeledValue<NSString>.localizedString(forLabel: $0) }
          return ["label": label as Any, "number": value.value.stringValue]
        }
        return ["id": contact.identifier, "displayName": displayName, "phoneNumbers": phones]
      }
    }

    Function("isMessageComposerAvailable") { () -> Bool in
      MFMessageComposeViewController.canSendText()
    }

    AsyncFunction("composeMessage") { (request: [String: Any], promise: Promise) in
      DispatchQueue.main.async {
        guard MFMessageComposeViewController.canSendText(),
              let presenter = self.appContext?.utilities?.currentViewController() else {
          promise.resolve(false)
          return
        }
        let recipients = (request["recipients"] as? [String] ?? []).filter { !$0.isEmpty }
        let body = request["body"] as? String ?? ""
        guard !recipients.isEmpty, !body.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty else {
          promise.resolve(false)
          return
        }
        let composer = MFMessageComposeViewController()
        composer.messageComposeDelegate = self
        composer.recipients = recipients
        composer.body = body
        presenter.present(composer, animated: true) { promise.resolve(true) }
      }
    }
  }

  public func messageComposeViewController(_ controller: MFMessageComposeViewController, didFinishWith result: MessageComposeResult) {
    controller.dismiss(animated: true)
  }
}
