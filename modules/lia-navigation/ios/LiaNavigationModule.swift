import CoreLocation
import ExpoModulesCore
#if canImport(GoogleMaps) && canImport(GoogleNavigation)
import GoogleMaps
import GoogleNavigation
#endif

public class LiaNavigationModule: Module, CLLocationManagerDelegate {
  private let manager = CLLocationManager()
  private var locationPromise: Promise?
  private var permissionPromise: Promise?
  private var permissionRequiresAlways = false

  public func definition() -> ModuleDefinition {
    Name("LiaNavigation")

    View(LiaNavigationMapView.self) {
      Events("onReady", "onUnavailable", "onRouteStatus", "onProgress", "onArrival")
      Prop("destinationLatitude") { (view, value: Double?) in view.setDestinationLatitude(value) }
      Prop("destinationLongitude") { (view, value: Double?) in view.setDestinationLongitude(value) }
      Prop("destinationPlaceId") { (view, value: String?) in view.setDestinationPlaceId(value) }
      Prop("destinationTitle") { (view, value: String?) in view.setDestinationTitle(value) }
      Prop("stopoverLatitude") { (view, value: Double?) in view.setStopoverLatitude(value) }
      Prop("stopoverLongitude") { (view, value: Double?) in view.setStopoverLongitude(value) }
      Prop("stopoverPlaceId") { (view, value: String?) in view.setStopoverPlaceId(value) }
      Prop("stopoverTitle") { (view, value: String?) in view.setStopoverTitle(value) }
      Prop("guidanceRequested") { (view, value: Bool) in view.setGuidanceRequested(value) }
      AsyncFunction("stopGuidance") { (view: LiaNavigationMapView) in view.stopGuidance() }
    }

    OnCreate {
      self.manager.delegate = self
      self.manager.desiredAccuracy = kCLLocationAccuracyBest
    }

    Function("isAvailable") { () -> Bool in CLLocationManager.locationServicesEnabled() }

    Function("authorizationStatus") { () -> String in
      return self.statusString(self.manager.authorizationStatus)
    }

    AsyncFunction("requestWhenInUsePermission") { (promise: Promise) in
      DispatchQueue.main.async {
        let status = self.manager.authorizationStatus
        if status == .authorizedWhenInUse || status == .authorizedAlways {
          promise.resolve(true)
          return
        }
        if status == .denied || status == .restricted {
          promise.resolve(false)
          return
        }
        self.permissionRequiresAlways = false
        self.permissionPromise = promise
        self.manager.requestWhenInUseAuthorization()
      }
    }

    AsyncFunction("requestAlwaysPermission") { (promise: Promise) in
      DispatchQueue.main.async {
        let status = self.manager.authorizationStatus
        if status == .authorizedAlways {
          promise.resolve(true)
          return
        }
        if status == .denied || status == .restricted {
          promise.resolve(false)
          return
        }
        self.permissionRequiresAlways = true
        self.permissionPromise = promise
        self.manager.requestAlwaysAuthorization()
        DispatchQueue.main.asyncAfter(deadline: .now() + 12) {
          guard self.permissionPromise != nil, self.permissionRequiresAlways else { return }
          let accepted = self.manager.authorizationStatus == .authorizedAlways
          let pending = self.permissionPromise
          self.permissionPromise = nil
          self.permissionRequiresAlways = false
          pending?.resolve(accepted)
        }
      }
    }

    Function("googleNavigationSdkAvailable") { () -> Bool in
      #if canImport(GoogleMaps) && canImport(GoogleNavigation)
      return true
      #else
      return false
      #endif
    }

    AsyncFunction("prepareGoogleNavigation") { (apiKey: String, companyName: String, promise: Promise) in
      DispatchQueue.main.async {
        #if canImport(GoogleMaps) && canImport(GoogleNavigation)
        guard !apiKey.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty else {
          promise.resolve("failed")
          return
        }
        GMSServices.provideAPIKey(apiKey)
        let options = GMSNavigationTermsAndConditionsOptions(companyName: companyName.isEmpty ? "Notre Table" : companyName)
        GMSNavigationServices.showTermsAndConditionsDialogIfNeeded(with: options) { accepted in
          promise.resolve(accepted ? "ready" : "terms_declined")
        }
        #else
        promise.resolve("sdk_unavailable")
        #endif
      }
    }

    AsyncFunction("currentLocation") { (promise: Promise) in
      DispatchQueue.main.async {
        let status = self.manager.authorizationStatus
        guard status == .authorizedWhenInUse || status == .authorizedAlways else {
          promise.resolve(nil)
          return
        }
        self.locationPromise = promise
        self.manager.requestLocation()
      }
    }
  }

  private func statusString(_ status: CLAuthorizationStatus) -> String {
    switch status {
    case .authorizedAlways: return "granted_always"
    case .authorizedWhenInUse: return "granted_when_in_use"
    case .denied: return "denied"
    case .restricted: return "restricted"
    case .notDetermined: return "undetermined"
    @unknown default: return "unknown"
    }
  }

  public func locationManagerDidChangeAuthorization(_ manager: CLLocationManager) {
    guard let promise = permissionPromise else { return }
    let status = manager.authorizationStatus
    if status == .notDetermined { return }
    if permissionRequiresAlways && status == .authorizedWhenInUse { return }
    permissionPromise = nil
    let requiresAlways = permissionRequiresAlways
    permissionRequiresAlways = false
    promise.resolve(requiresAlways ? status == .authorizedAlways : (status == .authorizedAlways || status == .authorizedWhenInUse))
  }

  public func locationManager(_ manager: CLLocationManager, didUpdateLocations locations: [CLLocation]) {
    guard let promise = locationPromise else { return }
    locationPromise = nil
    guard let location = locations.last else {
      promise.resolve(nil)
      return
    }
    let accuracy: Any
    if location.horizontalAccuracy >= 0 { accuracy = location.horizontalAccuracy } else { accuracy = NSNull() }
    promise.resolve([
      "latitude": location.coordinate.latitude,
      "longitude": location.coordinate.longitude,
      "horizontalAccuracy": accuracy,
      "timestampMs": location.timestamp.timeIntervalSince1970 * 1000
    ])
  }

  public func locationManager(_ manager: CLLocationManager, didFailWithError error: Error) {
    guard let promise = locationPromise else { return }
    locationPromise = nil
    promise.resolve(nil)
  }
}
