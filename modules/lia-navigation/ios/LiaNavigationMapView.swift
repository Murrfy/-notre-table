import ExpoModulesCore
import UIKit
import CoreLocation
#if canImport(GoogleMaps) && canImport(GoogleNavigation)
import GoogleMaps
import GoogleNavigation
#endif

final class LiaNavigationMapView: ExpoView {
  let onReady = EventDispatcher()
  let onUnavailable = EventDispatcher()
  let onRouteStatus = EventDispatcher()
  let onProgress = EventDispatcher()
  let onArrival = EventDispatcher()

  private var availabilitySent = false
  private var guidanceRequested = false
  private var destinationLatitude: Double?
  private var destinationLongitude: Double?
  private var destinationPlaceId: String?
  private var destinationTitle: String?
  private var stopoverLatitude: Double?
  private var stopoverLongitude: Double?
  private var stopoverPlaceId: String?
  private var stopoverTitle: String?
  private var routeKey: String?
  private var routeStarting = false
  private var guidanceRefreshScheduled = false

  #if canImport(GoogleMaps) && canImport(GoogleNavigation)
  fileprivate let googleMapView: GMSMapView
  #endif

  required init(appContext: AppContext? = nil) {
    #if canImport(GoogleMaps) && canImport(GoogleNavigation)
    self.googleMapView = GMSMapView(options: GMSMapViewOptions())
    #endif
    super.init(appContext: appContext)
    clipsToBounds = true
    backgroundColor = .systemBackground

    #if canImport(GoogleMaps) && canImport(GoogleNavigation)
    googleMapView.isNavigationEnabled = true
    googleMapView.cameraMode = .following
    googleMapView.settings.compassButton = true
    googleMapView.settings.myLocationButton = true
    googleMapView.isMyLocationEnabled = true
    googleMapView.overrideUserInterfaceStyle = .unspecified
    googleMapView.navigator?.add(self)
    addSubview(googleMapView)
    #endif
  }

  deinit {
    #if canImport(GoogleMaps) && canImport(GoogleNavigation)
    googleMapView.navigator?.remove(self)
    googleMapView.navigator?.clearDestinations()
    #endif
    DispatchQueue.main.async { UIApplication.shared.isIdleTimerDisabled = false }
  }

  override func layoutSubviews() {
    super.layoutSubviews()
    #if canImport(GoogleMaps) && canImport(GoogleNavigation)
    googleMapView.frame = bounds
    if !availabilitySent {
      availabilitySent = true
      onReady(["sdk": "google-navigation"])
      startGuidanceIfPossible()
    }
    #else
    if !availabilitySent {
      availabilitySent = true
      onUnavailable(["reason": "sdk_unavailable"])
    }
    #endif
  }

  func setDestinationLatitude(_ value: Double?) { destinationLatitude = value; scheduleGuidanceRefresh() }
  func setDestinationLongitude(_ value: Double?) { destinationLongitude = value; scheduleGuidanceRefresh() }
  func setDestinationPlaceId(_ value: String?) { destinationPlaceId = value?.trimmingCharacters(in: .whitespacesAndNewlines); scheduleGuidanceRefresh() }
  func setDestinationTitle(_ value: String?) { destinationTitle = value?.trimmingCharacters(in: .whitespacesAndNewlines); scheduleGuidanceRefresh() }
  func setStopoverLatitude(_ value: Double?) { stopoverLatitude = value; scheduleGuidanceRefresh() }
  func setStopoverLongitude(_ value: Double?) { stopoverLongitude = value; scheduleGuidanceRefresh() }
  func setStopoverPlaceId(_ value: String?) { stopoverPlaceId = value?.trimmingCharacters(in: .whitespacesAndNewlines); scheduleGuidanceRefresh() }
  func setStopoverTitle(_ value: String?) { stopoverTitle = value?.trimmingCharacters(in: .whitespacesAndNewlines); scheduleGuidanceRefresh() }
  func setGuidanceRequested(_ value: Bool) {
    guidanceRequested = value
    if value { scheduleGuidanceRefresh() } else { stopGuidance() }
  }

  private func scheduleGuidanceRefresh() {
    guard !guidanceRefreshScheduled else { return }
    guidanceRefreshScheduled = true
    DispatchQueue.main.async { [weak self] in
      guard let self else { return }
      self.guidanceRefreshScheduled = false
      self.startGuidanceIfPossible()
    }
  }

  func stopGuidance() {
    routeStarting = false
    routeKey = nil
    #if canImport(GoogleMaps) && canImport(GoogleNavigation)
    googleMapView.navigator?.clearDestinations()
    #endif
    UIApplication.shared.isIdleTimerDisabled = false
  }

  private func startGuidanceIfPossible() {
    guard guidanceRequested,
          let latitude = destinationLatitude,
          let longitude = destinationLongitude,
          let title = destinationTitle,
          !title.isEmpty else { return }
    let key = "\(latitude)|\(longitude)|\(destinationPlaceId ?? "")|\(title)|\(stopoverLatitude?.description ?? "")|\(stopoverLongitude?.description ?? "")|\(stopoverPlaceId ?? "")|\(stopoverTitle ?? "")"
    guard routeKey != key, !routeStarting else { return }

    #if canImport(GoogleMaps) && canImport(GoogleNavigation)
    guard let navigator = googleMapView.navigator else {
      onRouteStatus(["status": "failed", "reason": "navigator_unavailable"])
      return
    }
    let coordinate = CLLocationCoordinate2D(latitude: latitude, longitude: longitude)
    let waypoint: GMSNavigationWaypoint?
    if let placeId = destinationPlaceId, !placeId.isEmpty {
      waypoint = GMSNavigationWaypoint(location: coordinate, placeID: placeId, title: title)
    } else {
      waypoint = GMSNavigationWaypoint(location: coordinate, title: title)
    }
    guard let waypoint else {
      onRouteStatus(["status": "failed", "reason": "invalid_destination"])
      return
    }
    var waypoints = [GMSNavigationWaypoint]()
    if let stopLat = stopoverLatitude, let stopLng = stopoverLongitude, let stopTitle = stopoverTitle, !stopTitle.isEmpty {
      let stopCoordinate = CLLocationCoordinate2D(latitude: stopLat, longitude: stopLng)
      let stopWaypoint: GMSNavigationWaypoint?
      if let stopId = stopoverPlaceId, !stopId.isEmpty { stopWaypoint = GMSNavigationWaypoint(location: stopCoordinate, placeID: stopId, title: stopTitle) }
      else { stopWaypoint = GMSNavigationWaypoint(location: stopCoordinate, title: stopTitle) }
      if let stopWaypoint { waypoints.append(stopWaypoint) }
    }
    waypoints.append(waypoint)
    routeStarting = true
    navigator.setDestinations(waypoints) { [weak self] status in
      guard let self else { return }
      self.routeStarting = false
      guard status == .OK else {
        self.onRouteStatus(["status": "failed", "reason": "route_unavailable"])
        return
      }
      self.routeKey = key
      navigator.stopGuidanceAtArrival = self.stopoverTitle == nil
      navigator.sendsBackgroundNotifications = true
      navigator.timeUpdateThreshold = 15
      navigator.distanceUpdateThreshold = 50
      navigator.voiceGuidance = .alertsAndGuidance
      navigator.audioDeviceType = .bluetooth
      navigator.volumeLevel = .normal
      navigator.isGuidanceActive = true
      self.googleMapView.cameraMode = .following
      UIApplication.shared.isIdleTimerDisabled = true
      self.onRouteStatus(["status": "started", "destination": title])
    }
    #else
    onRouteStatus(["status": "failed", "reason": "sdk_unavailable"])
    #endif
  }
}

#if canImport(GoogleMaps) && canImport(GoogleNavigation)
extension LiaNavigationMapView: GMSNavigatorListener {
  func navigator(_ navigator: GMSNavigator, didUpdate navInfo: GMSNavigationNavInfo) {
    let state: String
    switch navInfo.navState {
    case .enroute: state = "enroute"
    case .rerouting: state = "rerouting"
    case .stopped: state = "stopped"
    @unknown default: state = "unknown"
    }

    var instruction = ""
    var roadName = ""
    if let step = navInfo.currentStep {
      roadName = step.simpleRoadName ?? ""
      let options = GMSNavigationInstructionOptions()
      instruction = navInfo.instructions(forStep: step, options: options).first?.string ?? roadName
    }

    onProgress([
      "etaSeconds": navInfo.timeToFinalDestinationSeconds,
      "distanceMeters": navInfo.distanceToFinalDestinationMeters,
      "roadName": roadName,
      "instruction": instruction,
      "stepDistanceMeters": navInfo.distanceToCurrentStepMeters,
      "navState": state,
      "routeChanged": navInfo.routeChanged
    ])
  }

  func navigator(_ navigator: GMSNavigator, didArriveAt waypoint: GMSNavigationWaypoint) {
    if let stopTitle = stopoverTitle, !stopTitle.isEmpty, waypoint.title == stopTitle {
      onArrival(["title": waypoint.title, "kind": "stopover"])
      stopoverLatitude = nil
      stopoverLongitude = nil
      stopoverPlaceId = nil
      stopoverTitle = nil
      _ = navigator.continueToNextDestination()
      navigator.stopGuidanceAtArrival = true
      navigator.isGuidanceActive = true
      return
    }
    UIApplication.shared.isIdleTimerDisabled = false
    onArrival(["title": waypoint.title, "kind": "final"])
  }
}
#endif
