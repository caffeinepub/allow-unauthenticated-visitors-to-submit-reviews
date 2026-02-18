import Text "mo:core/Text";
import Float "mo:core/Float";
import Time "mo:core/Time";
import Nat "mo:core/Nat";
import Array "mo:core/Array";
import Map "mo:core/Map";
import Iter "mo:core/Iter";
import Order "mo:core/Order";
import Int "mo:core/Int";
import Runtime "mo:core/Runtime";
import Principal "mo:core/Principal";
import Storage "blob-storage/Storage";
import AccessControl "authorization/access-control";
import MixinAuthorization "authorization/MixinAuthorization";
import MixinStorage "blob-storage/Mixin";

actor {
  var nextVehicleId = 0;
  var nextReviewId = 0;
  var nextContactFormId = 0;
  var yuanRate = 0.0;
  var euroRate = 0.0;
  var deliveryCost = 0.0;
  var selectionServiceCost = 0.0;
  var epTsCost = 0.0;
  var firstAdminAssigned = false;

  let vehicles = Map.empty<Nat, Vehicle>();
  let reviews = Map.empty<Nat, Review>();
  let contactFormSubmissions = Map.empty<Nat, ContactFormSubmission>();
  let userProfiles = Map.empty<Principal, UserProfile>();

  let accessControlState = AccessControl.initState();
  include MixinStorage();
  include MixinAuthorization(accessControlState);

  public type Review = {
    id : Nat;
    name : Text;
    city : Text;
    comment : Text;
    images : [Storage.ExternalBlob];
  };

  public type Vehicle = {
    id : Nat;
    brand : Text;
    model : Text;
    trim : Text;
    year : Nat;
    color : Text;
    mileage : Nat;
    horsepower : Nat;
    engineVolume : Nat;
    priceInYuan : Nat;
    description : Text;
    images : [Storage.ExternalBlob];
  };

  public type ContactFormSubmission = {
    id : Nat;
    name : Text;
    phone : Text;
    comment : Text;
    timestamp : Int;
  };

  public type UserProfile = {
    name : Text;
  };

  public type CostSettings = {
    deliveryCost : Float;
    selectionServiceCost : Float;
    epTsCost : Float;
  };

  public type CurrencyRates = {
    yuan : Float;
    euro : Float;
  };

  public type CurrencyAndCostSettings = {
    yuanRate : Float;
    euroRate : Float;
    deliveryCost : Float;
    selectionServiceCost : Float;
    epTsCost : Float;
  };

  // Helper function to ensure only the first authenticated user becomes admin
  private func ensureFirstUserIsAdmin(caller : Principal) {
    if (not firstAdminAssigned and caller != Principal.fromText("2vxsx-fae")) {
      AccessControl.assignRole(accessControlState, caller, caller, #admin);
      firstAdminAssigned := true;
    };
  };

  // PUBLIC - Anyone can view active filters
  public query ({ caller }) func getActiveFilters() : async {
    brands : [Text];
    models : [Text];
    colors : [Text];
  } {
    {
      brands = [];
      models = [];
      colors = [];
    };
  };

  // PUBLIC - Anyone can view currency rates
  public query ({ caller }) func getCurrencyRates() : async CurrencyRates {
    { yuan = yuanRate; euro = euroRate };
  };

  // PUBLIC - Anyone can view cost settings
  public query ({ caller }) func getCostSettings() : async CostSettings {
    {
      deliveryCost;
      selectionServiceCost;
      epTsCost;
    };
  };

  // PUBLIC - Anyone can view all settings
  public query ({ caller }) func getCurrencyAndCostSettings() : async CurrencyAndCostSettings {
    {
      yuanRate;
      euroRate;
      deliveryCost;
      selectionServiceCost;
      epTsCost;
    };
  };

  // ADMIN ONLY - Update currency rates
  public shared ({ caller }) func setCurrencyRates(yuan : Float, euro : Float) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Runtime.trap("Unauthorized: Only admins can update currency rates");
    };
    yuanRate := yuan;
    euroRate := euro;
  };

  // ADMIN ONLY - Update cost settings
  public shared ({ caller }) func setCostSettings(delivery : Float, selectionService : Float, epTs : Float) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Runtime.trap("Unauthorized: Only admins can update cost settings");
    };
    deliveryCost := delivery;
    selectionServiceCost := selectionService;
    epTsCost := epTs;
  };

  // ADMIN ONLY - Update all settings
  public shared ({ caller }) func setCurrencyAndCostSettings(yuan : Float, euro : Float, delivery : Float, selectionService : Float, epTs : Float) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Runtime.trap("Unauthorized: Only admins can update settings");
    };
    yuanRate := yuan;
    euroRate := euro;
    deliveryCost := delivery;
    selectionServiceCost := selectionService;
    epTsCost := epTs;
  };

  // USER - Get caller's own profile
  public query ({ caller }) func getCallerUserProfile() : async ?UserProfile {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can access profiles");
    };
    userProfiles.get(caller);
  };

  // USER/ADMIN - Get any user's profile (own or admin viewing others)
  public query ({ caller }) func getUserProfile(user : Principal) : async ?UserProfile {
    if (caller != user and not AccessControl.isAdmin(accessControlState, caller)) {
      Runtime.trap("Unauthorized: Can only view your own profile");
    };
    userProfiles.get(user);
  };

  // USER - Save caller's own profile
  public shared ({ caller }) func saveCallerUserProfile(profile : UserProfile) : async () {
    ensureFirstUserIsAdmin(caller);

    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can save profiles");
    };
    userProfiles.add(caller, profile);
  };

  // ========== VEHICLE MANAGEMENT ==========

  // PUBLIC - Anyone can view all vehicles
  public query ({ caller }) func getAllVehicles() : async [Vehicle] {
    vehicles.toArray().map(func(entry : (Nat, Vehicle)) : Vehicle { entry.1 });
  };

  // PUBLIC - Anyone can view filtered vehicles
  public query ({ caller }) func getVehiclesByFilter(brand : ?Text, model : ?Text, color : ?Text) : async [Vehicle] {
    let allVehicles = vehicles.toArray().map(func(entry : (Nat, Vehicle)) : Vehicle { entry.1 });

    allVehicles.filter<Vehicle>(
      func(v : Vehicle) : Bool {
        let brandMatch = switch (brand) {
          case (null) { true };
          case (?b) { v.brand == b };
        };
        let modelMatch = switch (model) {
          case (null) { true };
          case (?m) { v.model == m };
        };
        let colorMatch = switch (color) {
          case (null) { true };
          case (?c) { v.color == c };
        };
        brandMatch and modelMatch and colorMatch;
      },
    );
  };

  // PUBLIC - Anyone can view a specific vehicle
  public query ({ caller }) func getVehicle(id : Nat) : async ?Vehicle {
    vehicles.get(id);
  };

  // PUBLIC - Anyone can get unique brands
  public query ({ caller }) func getBrands() : async [Text] {
    let allVehicles = vehicles.toArray().map(func(entry : (Nat, Vehicle)) : Vehicle { entry.1 });
    let brandsArray = allVehicles.map(func(v : Vehicle) : Text { v.brand });
    brandsArray;
  };

  // PUBLIC - Anyone can get models by brand
  public query ({ caller }) func getModelsByBrand(brand : Text) : async [Text] {
    let allVehicles = vehicles.toArray().map(func(entry : (Nat, Vehicle)) : Vehicle { entry.1 });
    let filtered = allVehicles.filter(func(v : Vehicle) : Bool { v.brand == brand });
    filtered.map<Vehicle, Text>(func(v : Vehicle) : Text { v.model });
  };

  // PUBLIC - Anyone can get colors
  public query ({ caller }) func getColors() : async [Text] {
    let allVehicles = vehicles.toArray().map(func(entry : (Nat, Vehicle)) : Vehicle { entry.1 });
    allVehicles.map<Vehicle, Text>(func(v : Vehicle) : Text { v.color });
  };

  // ADMIN ONLY - Add new vehicle
  public shared ({ caller }) func addVehicle(vehicle : Vehicle) : async Nat {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Runtime.trap("Unauthorized: Only admins can add vehicles");
    };
    let id = nextVehicleId;
    nextVehicleId += 1;
    let newVehicle = {
      id;
      brand = vehicle.brand;
      model = vehicle.model;
      trim = vehicle.trim;
      year = vehicle.year;
      color = vehicle.color;
      mileage = vehicle.mileage;
      horsepower = vehicle.horsepower;
      engineVolume = vehicle.engineVolume;
      priceInYuan = vehicle.priceInYuan;
      description = vehicle.description;
      images = vehicle.images;
    };
    vehicles.add(id, newVehicle);
    id;
  };

  // ADMIN ONLY - Update vehicle
  public shared ({ caller }) func updateVehicle(id : Nat, vehicle : Vehicle) : async Bool {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Runtime.trap("Unauthorized: Only admins can update vehicles");
    };
    switch (vehicles.get(id)) {
      case (null) { false };
      case (?_) {
        vehicles.add(id, vehicle);
        true;
      };
    };
  };

  // ADMIN ONLY - Delete vehicle
  public shared ({ caller }) func deleteVehicle(id : Nat) : async Bool {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Runtime.trap("Unauthorized: Only admins can delete vehicles");
    };
    switch (vehicles.get(id)) {
      case (null) { false };
      case (?_) {
        vehicles.remove(id);
        true;
      };
    };
  };

  // ADMIN ONLY - Duplicate vehicle
  public shared ({ caller }) func duplicateVehicle(id : Nat) : async ?Nat {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Runtime.trap("Unauthorized: Only admins can duplicate vehicles");
    };
    switch (vehicles.get(id)) {
      case (null) { null };
      case (?vehicle) {
        let newId = nextVehicleId;
        nextVehicleId += 1;
        let duplicated = {
          id = newId;
          brand = vehicle.brand;
          model = vehicle.model;
          trim = vehicle.trim;
          year = vehicle.year;
          color = vehicle.color;
          mileage = vehicle.mileage;
          horsepower = vehicle.horsepower;
          engineVolume = vehicle.engineVolume;
          priceInYuan = vehicle.priceInYuan;
          description = vehicle.description;
          images = vehicle.images;
        };
        vehicles.add(newId, duplicated);
        ?newId;
      };
    };
  };

  // ========== REVIEW MANAGEMENT ==========

  // PUBLIC - Anyone can view all reviews
  public query ({ caller }) func getAllReviews() : async [Review] {
    reviews.toArray().map(func(entry : (Nat, Review)) : Review { entry.1 });
  };

  // PUBLIC - Anyone can submit a review
  public shared ({ caller }) func addReview(review : Review) : async Nat {
    let id = nextReviewId;
    nextReviewId += 1;
    let newReview = {
      id;
      name = review.name;
      city = review.city;
      comment = review.comment;
      images = review.images;
    };
    reviews.add(id, newReview);
    id;
  };

  // ADMIN ONLY - Update review
  public shared ({ caller }) func updateReview(id : Nat, review : Review) : async Bool {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Runtime.trap("Unauthorized: Only admins can update reviews");
    };
    switch (reviews.get(id)) {
      case (null) { false };
      case (?_) {
        reviews.add(id, review);
        true;
      };
    };
  };

  // ADMIN ONLY - Delete review
  public shared ({ caller }) func deleteReview(id : Nat) : async Bool {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Runtime.trap("Unauthorized: Only admins can delete reviews");
    };
    switch (reviews.get(id)) {
      case (null) { false };
      case (?_) {
        reviews.remove(id);
        true;
      };
    };
  };

  // ========== CONTACT FORM MANAGEMENT ==========

  // PUBLIC - Anyone can submit contact form
  public shared ({ caller }) func submitContactForm(name : Text, phone : Text, comment : Text) : async Nat {
    let id = nextContactFormId;
    nextContactFormId += 1;
    let submission = {
      id;
      name;
      phone;
      comment;
      timestamp = Time.now();
    };
    contactFormSubmissions.add(id, submission);
    id;
  };

  // ADMIN ONLY - Get all contact form submissions
  public query ({ caller }) func getAllContactFormSubmissions() : async [ContactFormSubmission] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Runtime.trap("Unauthorized: Only admins can view contact form submissions");
    };
    contactFormSubmissions.toArray().map(func(entry : (Nat, ContactFormSubmission)) : ContactFormSubmission { entry.1 });
  };

  // ADMIN ONLY - Delete contact form submission
  public shared ({ caller }) func deleteContactFormSubmission(id : Nat) : async Bool {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Runtime.trap("Unauthorized: Only admins can delete contact form submissions");
    };
    switch (contactFormSubmissions.get(id)) {
      case (null) { false };
      case (?_) {
        contactFormSubmissions.remove(id);
        true;
      };
    };
  };
};
