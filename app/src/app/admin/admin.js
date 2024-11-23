"use client";
import { useState, useEffect } from "react";
import axiosRes from "../lib/axios";
import $ from "jquery";
import ConfirmModal from "./modals/confirmModal";
import ErrorModal from "./modals/errorModal";
import NotifModal from "./modals/notifModal";
import { useRouter } from "next/navigation";

export default function adminSide() {
  const router = useRouter();
  //username
  const [username, setUsername] = useState("");
  // button name default
  const [btnName, setBtnName] = useState("Edit");
  // input fields
  const [inputEnable, setInputEnable] = useState(true);
  // enable buttons when New clinic button or clinic names is clicked
  const [btnEnable, setBtnEnable] = useState(true);
  // data storage after fetching it using useEffect
  const [clinics, setClinics] = useState([]);
  // for search bar
  const [searchQuery, setSearchQuery] = useState("");
  // get id for edit and delete
  const [id, setId] = useState("");
  // new clinic save button
  const [addEnable, setAddEnable] = useState(true);
  // suggestions
  const [suggestions, setSuggestions] = useState([]);
  const [selectedLocation, setSelectedLocation] = useState({
    lat: null,
    lon: null,
  });
  // modal display
  const [displayConfirm, setDisplayConfirm] = useState(false);
  const [displayError, setDisplayError] = useState(false);
  const [displayNotif, setDisplayNotif] = useState(false);
  // modal message
  const [notifMessage, setNotifMessage] = useState(null);
  const [errorMessage, setErrorMessage] = useState(null);
  const [confirmMessage, setConfirmMessage] = useState(null);
  // modal title
  const [notifTitle, setNotifTitle] = useState(
    "Hello, " + sessionStorage.getItem("username") + "!"
  );
  const [errorTitle, setErrorTitle] = useState(
    "Hello, " + sessionStorage.getItem("username") + "!"
  );
  const [confirmTitle, setConfirmTitle] = useState(
    "Hello, " + sessionStorage.getItem("username") + "!"
  );
  // fuction id
  const [functionId, setFunctionId] = useState(null);
  //isloading
  const [isLoading, setIsLoading] = useState(false);
  //temp address holder
  const [tempAddressHolder, setTempAddressHolder] = useState("");

  // url formatter
  const formatURL = (url) => {
    if (url && !url.startsWith("http://") && !url.startsWith("https://")) {
      return "https://" + url;
    }
    return url;
  };

  // empty object checker for fetch response
  const isEmptyObject = (obj) => {
    return Object.keys(obj).length === 0;
  };

  const handleSearch = (event) => {
    setSearchQuery(event.target.value.toLowerCase());
  };

  // check inputs
  function areFieldsEmpty() {
    const fields = [
      document.getElementById("name"),
      document.getElementById("location"),
      // document.getElementById("hour"),
      document.getElementById("number"),
      // document.getElementById("spec"),
      // document.getElementById("card"),
      // document.getElementById("rating"),
      // document.getElementById("year"),
      // document.getElementById("parking"),
      // document.getElementById("type"),
      // document.getElementById("fee"),
      // document.getElementById("fbLink"),
      // document.getElementById("webLink"),
      // document.getElementById("walkIn"),
      // document.getElementById("popularity"),
    ];

    for (let i = 0; i < fields.length; i++) {
      if (fields[i] && fields[i].value.trim() === "") {
        return true;
      }
    }
    return false;
  }

  // filter
  const filteredClinics = clinics.filter((clinic) =>
    clinic.name.toLowerCase().includes(searchQuery)
  );

  // image picker
  const [selectedImage, setSelectedImage] = useState(null);
  const handleImageChange = (event) => {
    const file = event.target.files[0];
    if (file) {
      const imageURL = URL.createObjectURL(file);
      setSelectedImage(imageURL);
    }
  };

  // clear input fields value
  const clearFields = () => {
    setSelectedImage(null);
    $("#logo").val("");
    $("#name").val("");
    $("#location").val("");
    $("#hour").val("");
    $("#spec").val("");
    $("#number").val("");
    $("#card").val("");
    $("#rating").val("");
    $("#year").val("");
    $("#parking").val("");
    $("#type").val("");
    $("#fee").val("");
    $("#fbLink").val("");
    $("#webLink").val("");
    $("#walkIn").val("");
    $("#popularity").val("");
  };

  // enable button and input fields
  const addNewClinic = () => {
    clearFields();
    setAddEnable(false);
    setInputEnable(false);
    $("#editButton").hide();
    $("#saveButton").show();
    $("#deleteButton").hide();
    $("#cancelButton").show();
  };

  //show add modal
  const showAddModal = () => {
    setConfirmMessage("Are you sure you want to add this clinic?");
    setDisplayConfirm(true);
  };

  //show edit modal
  const showEditModal = () => {
    setConfirmMessage("Are you sure you want to update this clinic?");
    setDisplayConfirm(true);
  };

  //show delete modal
  const showDeleteModal = () => {
    setConfirmMessage("Are you sure you want to delete this clinic?");
    setDisplayConfirm(true);
  };

  //show error modal
  const showErrorModal = () => {
    setDisplayError(true);
  };

  //show notif modal
  const showNotifModal = () => {
    setDisplayNotif(true);
  };

  const handleConfirmClose = () => {
    setDisplayConfirm(false);
  };

  const handleConfirmAction = () => {
    // Perform the action when confirmed
    setDisplayConfirm(false);
    //save / Edit / delete data

    //Default
    if (functionId === "default" || functionId === null) {
      setNotifMessage(null);
      setNotifMessage("No change made");
      showNotifModal();
    }

    //Add
    if (functionId === "add") {
      const formData = new FormData();
      formData.append("name", $("#name").val());
      formData.append("address", $("#location").val());
      formData.append("latitude", selectedLocation.lat);
      formData.append("longitude", selectedLocation.lon);
      formData.append("operation_hours", $("#hour").val());
      formData.append("specialization", $("#spec").val());
      formData.append("phonenumber", $("#number").val());
      formData.append("health_cards", $("#card").val());
      formData.append("ratings", $("#rating").val());
      formData.append("years_of_operation", $("#year").val());
      formData.append("parking_spot", $("#parking").val());
      formData.append("clinic_type", $("#type").val());
      formData.append("consultation_fee", $("#fee").val());
      formData.append("facebook_link", formatURL($("#fbLink").val()));
      formData.append("website_link", formatURL($("#webLink").val()));
      formData.append("walk_ins", $("#walkIn").val());
      formData.append("popularity", $("#popularity").val());

      const logo = $("#logo")[0].files[0];
      if (logo) {
        formData.append("logo", logo);
      }

      axiosRes
        .post(`/add`, formData, {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        })
        .then((response) => {
          // console.log(response.data);
          clearFields();
          setBtnEnable(true);
          setAddEnable(true);
          setInputEnable(true);
          $("#editButton").hide();
          $("#deleteButton").hide();
          $("#saveButton").hide();
          $("#cancelButton").hide();
          setFunctionId("default");
          setNotifMessage(null);
          setNotifMessage("New clinic added successfully");
          showNotifModal();

          setTimeout(() => {
            setNotifMessage("");
            setDisplayNotif(false);
          }, 3000);
        })
        .catch((error) => {
          // console.log("Error response data:", error.response.data);
          // console.log("Error status:", error.response.status);
        });
    }

    //Edit
    if (functionId === "edit") {
      const clinicId = id.toString();
      const formDataUpdate = new FormData();

    // Add common fields that don't depend on location
    formDataUpdate.append("name", $("#name").val());
    formDataUpdate.append("address", $("#location").val());
    formDataUpdate.append("operation_hours", $("#hour").val());
    formDataUpdate.append("specialization", $("#spec").val());
    formDataUpdate.append("phonenumber", $("#number").val());
    formDataUpdate.append("health_cards", $("#card").val());
    formDataUpdate.append("ratings", $("#rating").val());
    formDataUpdate.append("years_of_operation", $("#year").val());
    formDataUpdate.append("parking_spot", $("#parking").val());
    formDataUpdate.append("clinic_type", $("#type").val());
    formDataUpdate.append("consultation_fee", $("#fee").val());
    formDataUpdate.append("facebook_link", formatURL($("#fbLink").val()));
    formDataUpdate.append("website_link", formatURL($("#webLink").val()));
    formDataUpdate.append("walk_ins", $("#walkIn").val());
    formDataUpdate.append("popularity", $("#popularity").val());

    // kapag nag bago location input
    if (tempAddressHolder !== $("#location").val()) {
      formDataUpdate.append("latitude", selectedLocation.lat);
      formDataUpdate.append("longitude", selectedLocation.lon);
    }

      const logo = $("#logo")[0].files[0];
      if (logo) {
        const reader = new FileReader();
        reader.onloadend = function () {
          // convert base64 string
          const base64String = reader.result;

          formDataUpdate.append("logo", base64String);

          // send with logo
          axiosRes
            .put(`/clinics/${clinicId}`, formDataUpdate, {
              headers: {
                "Content-Type": "application/json",
              },
            })
            .then((response) => {
              // console.log(response.data);
              clearFields();
              setBtnEnable(true);
              setId("");
              $("#editButton").hide();
              $("#deleteButton").hide();
              $("#saveButton").hide();
              $("#cancelButton").hide();
              setNotifMessage(null);
              setNotifMessage("Clinic updated successfully");
              showNotifModal();

              setInputEnable(true);

              setTimeout(() => {
                setNotifMessage("");
                setDisplayNotif(false);
              }, 3000);
            })
            .catch((error) => {
              // console.error("Error response data:", error.response.data);
              // console.error("Error status:", error.response.status);
            });
        };
        reader.readAsDataURL(logo);
      } else {
        // update no logo
        axiosRes
          .put(`/clinics/${clinicId}`, formDataUpdate, {
            headers: {
              "Content-Type": "application/json",
            },
          })
          .then((response) => {
            // console.log(response.data);
            clearFields();
            setBtnEnable(true);
            setId("");
            $("#editButton").hide();
            $("#deleteButton").hide();
            $("#saveButton").hide();
            $("#cancelButton").hide();
            setNotifMessage(null);
            setNotifMessage("Clinic updated successfully");
            showNotifModal();

            setInputEnable(true);

            setTimeout(() => {
              setNotifMessage("");
              setDisplayNotif(false);
            }, 3000);
          })
          .catch((error) => {
            // console.error("Error response data:", error.response.data);
            // console.error("Error status:", error.response.status);
          });
      }
    }

    //Delete
    if (functionId === "delete") {
      const clinicId = id.toString();

      axiosRes
        .delete(`/clinics/${clinicId}`)
        .then((response) => {
          // console.log(response.data);
          setBtnEnable(true);
          clearFields();
          setId("");
          setFunctionId("default");
          $("#editButton").hide();
          $("#deleteButton").hide();
          $("#saveButton").hide();
          $("#cancelButton").hide();
          setNotifMessage(null);
          setNotifMessage("Clinic deleted successfully");
          showNotifModal();

          setTimeout(() => {
            setNotifMessage("");
            setDisplayNotif(false);
          }, 3000);
        })
        .catch((error) => {
          // console.log("Error response data:", error.response.data);
          // console.log("Error status:", error.response.status);
        });
    }

    //Logout
    if (functionId === "logout") {
      sessionStorage.clear();
      router.push("/");
    }
  };

  const handleLogout = () => {
    setConfirmMessage("Are you sure you want to logout?");
    setDisplayConfirm(true);
    setFunctionId("logout");
  };

  const handleErrorClose = () => {
    setDisplayError(false);
  };

  const handleNotifClose = () => {
    setNotifMessage("");
    setDisplayNotif(false);
  };

  //cancel
  const cancelInputs = () => {
    clearFields();
    setAddEnable(true);
    setInputEnable(true);
    $("#editButton").hide();
    $("#deleteButton").hide();
    $("#saveButton").hide();
    $("#cancelButton").hide();
  };

  const addClinicData = () => {
    if (areFieldsEmpty()) {
      setErrorMessage(
        "Please fill in all required fields such as name, location, and contact number."
      );
      showErrorModal();
    } else {
      if (
        ($("#fbLink").val() &&
          ((!$("#fbLink").val().startsWith("http://") &&
            !$("#fbLink").val().startsWith("https://")) ||
            $("#fbLink").val().includes(" "))) ||
        ($("#webLink").val() &&
          ((!$("#webLink").val().startsWith("http://") &&
            !$("#webLink").val().startsWith("https://")) ||
            $("#webLink").val().includes(" ")))
      ) {
        setErrorMessage(
          "Please enter valid Facebook and website links starting with http:// or https:// and without spaces."
        );
        showErrorModal();
        return;
      } else {
        setFunctionId("add");
        showAddModal();
      }
    }
  };

  // get clinic data by clicking specific clinic name
  const getClinicID = (event) => {
    setBtnName("Edit");
    $("#editButton").show();
    $("#saveButton").hide();
    $("#cancelButton").hide();
    $("#deleteButton").show();
    clearFields();
    setInputEnable(true);
    setBtnEnable(false);
    const id = event;
    setId(id);
    {
      clinics.map((data) => {
        if (data.id == id) {
          $("#name").val(data.name);
          $("#location").val(data.address);
          $("#hour").val(data.operation_hours);
          $("#spec").val(data.specialization);
          $("#number").val(data.phonenumber.toString());
          $("#card").val(data.health_cards);
          $("#rating").val(data.ratings);
          $("#year").val(data.years_of_operation);
          $("#parking").val(data.parking_spot);
          $("#type").val(data.clinic_type?.toUpperCase());
          $("#fee").val(data.consultation_fee);
          $("#fbLink").val(data.facebook_link);
          $("#webLink").val(data.website_link);
          $("#walkIn").val(data.walk_ins);
          $("#popularity").val(data.popularity);

          // check the image and set
          if (data.logo) {
            setSelectedImage(data.logo);
          } else {
            setSelectedImage(null);
          }

          setTempAddressHolder(data.address);
        }
      });
    }
  };

  //edit clinic data
  const editClinicData = () => {
    if (areFieldsEmpty()) {
      setErrorMessage(
        "Please fill in all required fields such as name, location, and contact number."
      );
      showErrorModal();
    } else {
      if (
        ($("#fbLink").val() &&
          ((!$("#fbLink").val().startsWith("http://") &&
            !$("#fbLink").val().startsWith("https://")) ||
            $("#fbLink").val().includes(" "))) ||
        ($("#webLink").val() &&
          ((!$("#webLink").val().startsWith("http://") &&
            !$("#webLink").val().startsWith("https://")) ||
            $("#webLink").val().includes(" ")))
      ) {
        setErrorMessage(
          "Please enter valid Facebook and website links starting with http:// or https:// and without spaces."
        );
        showErrorModal();
        return;
      } else {
        setFunctionId("edit");
        showEditModal();
      }
    }
  };

  const deleteClinic = () => {
    setFunctionId("delete");
    showDeleteModal();
  };

  // change edit button text to save
  const editButton = (event) => {
    $("#saveButton").hide();
    setBtnName("Save");

    if (event.target.innerText == "Edit") {
      setInputEnable(false);
    }
    if (btnName == "Save") {
      editClinicData();
    }
  };

  function getSuggestions(query) {
    if (!query.target.value) {
      setSuggestions([]);
      return;
    }

    const metroManilaBounds = "120.9066,14.4051,121.1165,14.7730";
    const apiUrl = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(
      query.target.value
    )}&format=json&limit=5&viewbox=${metroManilaBounds}&bounded=1`;

    fetch(apiUrl)
      .then((response) => {
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        return response.text();
      })
      .then((text) => {
        try {
          const data = JSON.parse(text);
          const validSuggestions = data
            .filter((location) => location.lat && location.lon)
            .map((location) => {
              const addressParts = location.display_name.split(", ");
              // Extract and combine relevant parts of the address
              const name = addressParts[0];
              const street = addressParts.find(
                (part) =>
                  part.includes("Street") ||
                  part.includes("Road") ||
                  part.includes("Avenue")
              );
              const barangay = addressParts.find((part) =>
                part.includes("Barangay")
              );
              const city = addressParts.find(
                (part) =>
                  !part.includes("Barangay") &&
                  !part.includes("Street") &&
                  !part.includes("Road") &&
                  !part.includes("Avenue") &&
                  part !== name
              );
              const province = addressParts[addressParts.length - 2];

              const relevantParts = [
                name,
                street,
                barangay,
                city,
                province,
              ].filter(Boolean);
              return {
                ...location,
                display_name: relevantParts.join(", "),
              };
            });

          // If no valid suggestions, add user input as a suggestion
          // if (validSuggestions.length === 0) {
          //   validSuggestions.push({
          //     display_name: query.target.value,
          //     lat: null,
          //     lon: null,
          //   });
          // }

          setSuggestions(validSuggestions);
        } catch (error) {
          // console.error("Error parsing JSON:", error);
          // console.log("Raw API response:", text);
          // If there's an error, still display the user input
          setSuggestions([
            {
              display_name: query.target.value,
              lat: null,
              lon: null,
            },
          ]);
        }
      })
      .catch((error) => {
        // console.error("Error fetching location suggestions:", error);
        // If there's an error, display the user input
        setSuggestions([
          {
            display_name: query.target.value,
            lat: null,
            lon: null,
          },
        ]);
      })
      .finally(() => {
        setIsLoading(false);
      });
  }

  function handleSuggestionSelect(suggestion) {
    document.getElementById("location").value = suggestion.display_name;
    setSuggestions([]);

    setSelectedLocation({
      lat: suggestion.lat,
      lon: suggestion.lon,
    });
    // console.log("Selected location:", {
    //   lat: suggestion.lat,
    //   lon: suggestion.lon,
    // });
  }

  // fetch all the clinic data and set to clinics using useState | refresh every 5 sec
  useEffect(() => {
    $("#saveButton").hide();
    $("#stopLoading").hide();
    $("#stopLoadingMobile").hide();
    $("#noData").hide();
    $("#noDataMobile").hide();

    const storedUsername = sessionStorage.getItem("username");
    setUsername(storedUsername ? storedUsername.toUpperCase() : "");

    if (typeof window !== "undefined") {
      require("bootstrap/dist/js/bootstrap.bundle.min.js");
    }

    const fetchClinics = async () => {
      try {
        const response = await axiosRes.get("/clinics");
        if (
          !isEmptyObject(response.data) &&
          response.data.data &&
          response.data.data.length > 0
        ) {
          setClinics(response.data.data);
          $("#startLoading").hide();
          $("#stopLoading").show();
          $("#noData").hide();
          $("#noDataMobile").hide();
          $("#startLoadingMobile").hide();
          $("#stopLoadingMobile").show();
        } else {
          setClinics([]);
          $("#startLoading").hide();
          $("#stopLoading").show();
          $("#noData").show();
          $("#noDataMobile").show();
          $("#startLoadingMobile").hide();
          $("#stopLoadingMobile").show();
        }
      } catch (err) {
        //
        $("#noData").show();
        $("#noDataMobile").show();
        $("#startLoading").hide();
        $("#startLoadingMobile").hide();
      }
    };
    fetchClinics();
    const intervalId = setInterval(fetchClinics, 3500);
    return () => clearInterval(intervalId);
  }, []);

  return (
    <main className="vh-100 d-flex flex-column flex-md-row bg-white">
      {/* Burger Menu */}
      <button
        className="btn btn-warning d-md-none m-3 rounded-4 text-white fw-bold"
        type="button"
        data-bs-toggle="offcanvas"
        data-bs-target="#offcanvasSidebar"
        aria-controls="offcanvasSidebar"
        data-bs-backdrop="false"
        data-bs-scroll="true"
      >
        <i className="bi bi-list"></i> Menu
      </button>

      {/* Off canvas */}
      <div
        className="offcanvas offcanvas-start d-md-none"
        tabIndex="-1"
        id="offcanvasSidebar"
        aria-labelledby="offcanvasSidebarLabel"
      >
        <div className="offcanvas-header">
          <label className="text-decoration-none">
            <h3 className="mt-2 text-dark fw-bold">DermaServTech</h3>
          </label>
          <button
            type="button"
            className="btn-close text-reset"
            data-bs-dismiss="offcanvas"
            aria-label="Close"
            data-bs-backdrop="false"
            data-bs-scroll="true"
          ></button>
        </div>
        <div className="offcanvas-body bg-white text-dark">
          <ul className="list-unstyled">
            <li className="mb-3">
              <button
                onClick={addNewClinic}
                className="btn btn-outline-warning border border-2 border-warning w-100 text-dark fw-medium rounded-4 py-2"
                type="button"
                data-bs-toggle="offcanvas"
                data-bs-target="#offcanvasSidebar"
                aria-controls="offcanvasSidebar"
                data-bs-backdrop="false"
                data-bs-scroll="true"
              >
                <i className="bi bi-plus me-1"></i>
                New Clinic
              </button>
            </li>
            <li className="mb-3">
              <p className="lead fw-medium text-dark mb-2">Clinics</p>
              <div
                className="recent-chats-scrollable px-2 custom-scroll"
                style={{
                  maxHeight: "calc(100vh - 300px)",
                  overflowY: "auto",
                  width: "100%",
                }}
              >
                <ul className="list-unstyled">
                  <div id="noDataMobile">
                    <li className="mb-2">
                      <p className="text-black text-center">No data found</p>
                    </li>
                  </div>
                  <div id="startLoadingMobile">
                    <li className="mb-2">
                      <p className="text-black text-center">Loading...</p>
                    </li>
                  </div>
                  <div id="stopLoadingMobile">
                    {searchQuery
                      ? filteredClinics.map((clinic) => (
                          <li key={clinic.id} className="mb-2">
                            <button
                              className="btn btn-light text-start rounded-4 w-100 py-2"
                              onClick={() => {
                                getClinicID(clinic.id);
                                document
                                  .querySelector(
                                    '[data-bs-dismiss="offcanvas"]'
                                  )
                                  .click();
                              }}
                              data-bs-backdrop="false"
                              data-bs-scroll="true"
                            >
                              {clinic.name}
                            </button>
                          </li>
                        ))
                      : clinics.map((clinic, index) => (
                          <li key={clinic.id} className="mb-2">
                            <button
                              className="btn btn-light text-start rounded-4 w-100 py-2"
                              onClick={() => {
                                getClinicID(clinic.id);
                                document
                                  .querySelector(
                                    '[data-bs-dismiss="offcanvas"]'
                                  )
                                  .click();
                              }}
                              data-bs-backdrop="false"
                              data-bs-scroll="true"
                            >
                              {clinic.name}
                            </button>
                          </li>
                        ))}
                  </div>
                </ul>
              </div>
            </li>
          </ul>
          <div className="position-absolute bottom-0 start-0 p-3 w-100 bg-white">
            <div className="d-flex align-items-center">
              <label className="text-dark text-decoration-none fw-medium">
                <i className="bi bi-person-circle me-2"></i>
                {username}
              </label>
            </div>
            <div className="d-flex align-items-center mb-2">
              <i className="fas fa-user-cog me-2"></i>
              <button
                onClick={handleLogout}
                className="text-decoration-none fw-medium btn btn-md btn-warning w-100 text-white rounded rounded-4 mt-3"
              >
                <i className="bi bi-arrow-left-square me-3"></i>
                Logout
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Sidebar - large ka sakin*/}
      <div
        className="bg-white text-white p-3 d-none d-md-block"
        style={{
          width: "25%",
          maxWidth: "350px",
          height: "100vh",
          position: "relative",
          overflowY: "auto",
        }}
      >
        <label className="text-decoration-none">
          <h3 className="mb-3 text-dark fw-bold">DermaServTech</h3>
        </label>
        <ul className="list-unstyled">
          <li className="mb-4">
            <button
              onClick={addNewClinic}
              className="btn btn-outline-warning border border-2 border-warning w-100 text-dark fw-medium rounded rounded-4"
            >
              <i className="bi bi-plus me-1"></i>
              New Clinic
            </button>
          </li>
          <li className="mb-3">
            <p className="lead fw-medium text-dark">Clinics</p>
            <div
              className="recent-chats-scrollable px-2 custom-scroll"
              style={{
                height: "calc(100vh - 300px)",
                overflowY: "auto",
                width: "100%",
              }}
            >
              <ul className="list-unstyled">
                <div id="noData">
                  <li className="mb-2">
                    <p className="text-black text-center">No data found</p>
                  </li>
                </div>
                <div id="startLoading">
                  <li className="mb-2">
                    <p className="text-black text-center">Loading...</p>
                  </li>
                </div>
                <div id="stopLoading">
                  {searchQuery
                    ? filteredClinics.map((clinic) => (
                        <li key={clinic.id} className="mb-2">
                          <button
                            className="btn btn-light text-start rounded-4 w-100"
                            onClick={() => getClinicID(clinic.id)}
                          >
                            {clinic.name}
                          </button>
                        </li>
                      ))
                    : clinics.map((clinic, index) => (
                        <li key={clinic.id} className="mb-2">
                          <button
                            className="btn btn-light text-start rounded-4 w-100"
                            onClick={() => getClinicID(clinic.id)}
                          >
                            {clinic.name}
                          </button>
                        </li>
                      ))}
                </div>
              </ul>
            </div>
            <div className="border border-2 border-light"></div>
          </li>
        </ul>
        <div className="position-absolute bottom-0 start-0 p-3 w-100 bg-white">
          <div className="d-flex align-items-center">
            <i className="fas fa-user me-2"></i>
            <label className="text-dark text-decoration-none fw-medium">
              <i className="bi bi-person-circle me-2"></i>
              {username}
            </label>
          </div>
          <div className="d-flex align-items-center mb-2">
            <i className="fas fa-user-cog me-2"></i>
            <button
              onClick={handleLogout}
              className="text-decoration-none fw-medium btn btn-md btn-warning w-100 text-white rounded rounded-4 mt-3"
            >
              <i className="bi bi-arrow-left-square me-3"></i>
              Logout
            </button>
          </div>
        </div>
      </div>

      {/* Content UI ka sakin*/}
      <div className="flex-grow-1 d-flex flex-column align-items-center justify-content-center bg-white py-2 px-3">
        <div
          className="chatbot-container p-3 w-100 w-md-75 vh-100 rounded-5"
          style={{ backgroundColor: "#F1F1F1", maxWidth: "95%" }}
        >
          <div className=" d-flex flex-wrap align-items-center justify-content-between mx-3 my-auto">
            <div>
              <button
                className="btn btn-warning text-dark shadow-sm rounded-3 me-4 mt-2 fw-medium"
                style={{ width: "100px", display: "none" }}
                onClick={editButton}
                disabled={btnEnable}
                id="editButton"
              >
                {btnName}
                <span>
                  <i className="bi-pencil-square ms-2"></i>
                </span>
              </button>
              <button
                className="btn btn-warning text-dark shadow-sm rounded-3 me-4 mt-2 fw-medium"
                style={{ width: "100px", display: "none" }}
                onClick={addClinicData}
                disabled={addEnable}
                id="saveButton"
              >
                Save
                <span>
                  <i className="bi-pencil-square ms-2"></i>
                </span>
              </button>
              <button
                className="btn text-danger shadow-sm rounded-3 me-4 mt-2 fw-medium"
                style={{ width: "100px", background: "white", display: "none" }}
                onClick={deleteClinic}
                disabled={btnEnable}
                id="deleteButton"
              >
                Delete
                <i className="bi-trash ms-2"></i>
              </button>
              <button
                className="btn text-danger shadow-sm rounded-3 me-4 mt-2 fw-medium btn-outline-danger"
                style={{ width: "108px", background: "white", display: "none" }}
                onClick={cancelInputs}
                disabled={addEnable}
                id="cancelButton"
              >
                Cancel
                <span>
                  <i className="bi-x ms-2"></i>
                </span>
              </button>
            </div>
            <div>
              <input
                type="text"
                className=" border border-secondary no-outline text-muted rounded-3 shadow-sm px-2  mt-2"
                placeholder="Search Clinic"
                style={{ height: "38px", width: "100%" }}
                onChange={handleSearch}
                id="search"
              />
            </div>
          </div>

          <card
            className="card d-flex flex-column mt-3 border rounded-4 bg-white p-3 "
            style={{
              maxHeight: "calc(100dvh - 140px)",
              height: "calc(100dvh - 140px)",
            }}
          >
            <card className="card-body my-2 custom-scroll">
              <div className="row align-items-center">
                <div className="col-lg-3 col-md-3">
                  <label className="fw-bold">Clinic Logo:</label>
                </div>
                <div className="col-lg-9 col-md-9">
                  {selectedImage && (
                    <div className="col-lg-9 col-md-9 mt-2 mb-2">
                      <img
                        src={selectedImage}
                        alt="Selected Clinic Logo"
                        style={{ maxWidth: "100%", maxHeight: "200px" }}
                        className="border rounded"
                        id="logoImg"
                      />
                    </div>
                  )}
                </div>
                <div className="col-lg-9 col-md-9">
                  <input
                    type="file"
                    accept="image/*"
                    style={{
                      width: "100%",
                      minHeight: "35px",
                      height: "40px",
                      maxHeight: "100px",
                    }}
                    className="p-1"
                    disabled={inputEnable}
                    onChange={handleImageChange}
                    id="logo"
                  />
                </div>
              </div>
              <div
                className="border my-2"
                style={{ background: "#F1F1F1" }}
              ></div>
              <div className="row align-items-center">
                <div className="col-lg-3 col-md-3">
                  <label className="fw-bold">Clinic Name:</label>
                </div>
                <div className="col-lg-9 col-md-9">
                  <input
                    type="text"
                    style={{
                      width: "100%",
                      minHeight: "35px",
                      height: "35px",
                      maxHeight: "100px",
                    }}
                    className="border rounded-3 p-1"
                    disabled={inputEnable}
                    id="name"
                    required
                  />
                </div>
              </div>
              <div
                className="border my-2"
                style={{ background: "#F1F1F1" }}
              ></div>
              <div className="row align-items-center">
                <div className="col-lg-3 col-md-3">
                  <label className="fw-bold">Location:</label>
                </div>
                <div className="col-lg-9 col-md-9">
                  <div style={{ position: "relative" }}>
                    <input
                      type="text"
                      style={{
                        width: "100%",
                        minHeight: "35px",
                        height: "35px",
                        maxHeight: "100px",
                      }}
                      className="border rounded-3 p-1"
                      disabled={inputEnable}
                      id="location"
                      required
                      onChange={(e) => getSuggestions(e)}
                      autoComplete="off"
                      // onPaste={(e) => e.preventDefault()}
                    />
                    {suggestions.length > 0 && (
                      <ul
                        className="suggestions-list"
                        style={{
                          position: "absolute",
                          width: "100%",
                          maxHeight: "200px",
                          overflowY: "auto",
                          zIndex: 1000,
                          backgroundColor: "white",
                          border: "1px solid #ccc",
                          borderRadius: "0 0 4px 4px",
                          listStyleType: "none",
                          padding: 0,
                          margin: 0,
                        }}
                      >
                        {isLoading ? (
                          <li style={{ padding: "8px", textAlign: "center" }}>
                            Loading...
                          </li>
                        ) : (
                          suggestions.map((suggestion, index) => (
                            <li
                              key={index}
                              onClick={() => handleSuggestionSelect(suggestion)}
                              style={{
                                padding: "8px",
                                cursor: "pointer",
                                borderBottom: "1px solid #eee",
                              }}
                            >
                              {suggestion.display_name}
                            </li>
                          ))
                        )}
                      </ul>
                    )}
                  </div>
                </div>
              </div>

              <div
                className="border my-2"
                style={{ background: "#F1F1F1" }}
              ></div>
              <div className="row align-items-center">
                <div className="col-lg-3 col-md-3">
                  <label className="fw-bold">Contact Number:</label>
                </div>
                <div className="col-lg-9 col-md-9">
                  <input
                    type="number"
                    style={{
                      width: "100%",
                      minHeight: "35px",
                      height: "35px",
                      maxHeight: "100px",
                    }}
                    className="border rounded-3 p-1"
                    disabled={inputEnable}
                    id="number"
                    required
                  />
                </div>
              </div>
              <div
                className="border my-2"
                style={{ background: "#F1F1F1" }}
              ></div>
              <div className="row align-items-center">
                <div className="col-lg-3 col-md-3">
                  <label className="fw-bold">Open Hours:</label>
                </div>
                <div className="col-lg-9 col-md-9">
                  <textarea
                    type="text"
                    style={{
                      width: "100%",
                      minHeight: "35px",
                      height: "35px",
                      maxHeight: "100px",
                    }}
                    className="border rounded-3 p-1"
                    disabled={inputEnable}
                    id="hour"
                    required
                  />
                </div>
              </div>
              <div
                className="border my-2"
                style={{ background: "#F1F1F1" }}
              ></div>
              <div className="row align-items-center">
                <div className="col-lg-3 col-md-3">
                  <label className="fw-bold">Specialization:</label>
                </div>
                <div className="col-lg-9 col-md-9">
                  <textarea
                    type="text"
                    style={{
                      width: "100%",
                      minHeight: "35px",
                      height: "35px",
                      maxHeight: "100px",
                    }}
                    className="border rounded-3 p-1"
                    disabled={inputEnable}
                    id="spec"
                    required
                  />
                </div>
              </div>

              <div
                className="border my-2"
                style={{ background: "#F1F1F1" }}
              ></div>
              <div className="row align-items-center">
                <div className="col-lg-3 col-md-3">
                  <label className="fw-bold">Health Cards:</label>
                </div>
                <div className="col-lg-9 col-md-9">
                  <select
                    style={{
                      width: "100%",
                      minHeight: "35px",
                      height: "35px",
                      maxHeight: "100px",
                    }}
                    className="border rounded-3 p-1"
                    disabled={inputEnable}
                    id="card"
                    required
                  >
                    <option style={{width: "100%"}} selected value="N/A">N/A</option>
                    <option style={{width: "100%"}} value="ACCEPT">ACCEPT</option>
                    <option style={{width: "100%"}} value="DONT_ACCEPT">DON'T ACCEPT</option>
                  </select>
                </div>
              </div>
              <div
                className="border my-2"
                style={{ background: "#F1F1F1" }}
              ></div>
              <div className="row align-items-center">
                <div className="col-lg-3 col-md-3">
                  <label className="fw-bold">Ratings:</label>
                </div>
                <div className="col-lg-9 col-md-9">
                  <input
                    type="number"
                    style={{
                      width: "100%",
                      minHeight: "35px",
                      height: "35px",
                      maxHeight: "100px",
                    }}
                    className="border rounded-3 p-1"
                    disabled={inputEnable}
                    id="rating"
                    required
                  />
                </div>
              </div>
              <div
                className="border my-2"
                style={{ background: "#F1F1F1" }}
              ></div>
              <div className="row align-items-center">
                <div className="col-lg-3 col-md-3">
                  <label className="fw-bold">Year of Operation:</label>
                </div>
                <div className="col-lg-9 col-md-9">
                  <input
                    type="number"
                    style={{
                      width: "100%",
                      minHeight: "35px",
                      height: "35px",
                      maxHeight: "100px",
                    }}
                    className="border rounded-3 p-1"
                    disabled={inputEnable}
                    id="year"
                    required
                  />
                </div>
              </div>
              <div
                className="border my-2"
                style={{ background: "#F1F1F1" }}
              ></div>
              <div className="row align-items-center">
                <div className="col-lg-3 col-md-3">
                  <label className="fw-bold">Parking Spot:</label>
                </div>
                <div className="col-lg-9 col-md-9">
                  <select
                    style={{
                      width: "100%",
                      minHeight: "35px",
                      height: "35px", 
                      maxHeight: "100px",
                    }}
                    className="border rounded-3 p-1"
                    disabled={inputEnable}
                    id="parking"
                    required
                  >
                    <option style={{width: "100%"}} selected value="N/A">N/A</option>
                    <option style={{width: "100%"}} value="YES">YES</option>
                    <option style={{width: "100%"}} value="NO">NO</option>
                  </select>
                </div>
              </div>
              <div
                className="border my-2"
                style={{ background: "#F1F1F1" }}
              ></div>
              <div className="row align-items-center">
                <div className="col-lg-3 col-md-3">
                  <label className="fw-bold">Clinic Type:</label>
                </div>
                <div className="col-lg-9 col-md-9">
                  <select
                    style={{
                      width: "100%",
                      minHeight: "35px", 
                      height: "35px",
                      maxHeight: "100px",
                    }}
                    className="border rounded-3 p-1"
                    disabled={inputEnable}
                    id="type"
                    required
                  >
                    <option style={{width: "100%"}} selected value="N/A">N/A</option>
                    <option style={{width: "100%"}} value="PRIVATE">PRIVATE</option>
                    <option style={{width: "100%"}} value="PUBLIC">PUBLIC</option>
                  </select>
                </div>
              </div>
              <div
                className="border my-2"
                style={{ background: "#F1F1F1" }}
              ></div>
              <div className="row align-items-center">
                <div className="col-lg-3 col-md-3">
                  <label className="fw-bold">Consultaion Fee:</label>
                </div>
                <div className="col-lg-9 col-md-9">
                  <input
                    type="text"
                    style={{
                      width: "100%",
                      minHeight: "35px",
                      height: "35px",
                      maxHeight: "100px",
                    }}
                    className="border rounded-3 p-1"
                    disabled={inputEnable}
                    id="fee"
                    required
                  />
                </div>
              </div>
              <div
                className="border my-2"
                style={{ background: "#F1F1F1" }}
              ></div>
              <div className="row align-items-center">
                <div className="col-lg-3 col-md-3">
                  <label className="fw-bold">Facebook Link:</label>
                </div>
                <div className="col-lg-9 col-md-9">
                  <input
                    type="text"
                    style={{
                      width: "100%",
                      minHeight: "35px",
                      height: "35px",
                      maxHeight: "100px",
                    }}
                    className="border rounded-3 p-1"
                    disabled={inputEnable}
                    id="fbLink"
                  />
                </div>
              </div>
              <div
                className="border my-2"
                style={{ background: "#F1F1F1" }}
              ></div>
              <div className="row align-items-center">
                <div className="col-lg-3 col-md-3">
                  <label className="fw-bold">Website Link:</label>
                </div>
                <div className="col-lg-9 col-md-9">
                  <input
                    type="text"
                    style={{
                      width: "100%",
                      minHeight: "35px",
                      height: "35px",
                      maxHeight: "100px",
                    }}
                    className="border rounded-3 p-1"
                    disabled={inputEnable}
                    id="webLink"
                  />
                </div>
                <div
                  className="border my-2"
                  style={{ background: "#F1F1F1" }}
                ></div>
                <div className="row align-items-center">
                  <div className="col-lg-3 col-md-3">
                    <label className="fw-bold">Walk-In:</label>
                  </div>
                  <div className="col-lg-9 col-md-9">
                    <input
                      type="text"
                      style={{
                        width: "100%",
                        minHeight: "35px",
                        height: "35px",
                        maxHeight: "100px",
                      }}
                      className="border rounded-3 p-1"
                      disabled={inputEnable}
                      id="walkIn"
                      required
                    />
                  </div>
                </div>
                <div
                  className="border my-2"
                  style={{ background: "#F1F1F1" }}
                ></div>
                <div className="row align-items-center">
                  <div className="col-lg-3 col-md-3">
                    <label className="fw-bold">Popularity:</label>
                  </div>
                  <div className="col-lg-9 col-md-9">
                    <input
                      type="text"
                      style={{
                        width: "100%",
                        minHeight: "35px",
                        height: "35px",
                        maxHeight: "100px",
                      }}
                      className="border rounded-3 p-1"
                      disabled={inputEnable}
                      id="popularity"
                      required
                    />
                  </div>
                </div>
              </div>
            </card>
          </card>
        </div>
      </div>

      <ConfirmModal
        display={displayConfirm}
        onClose={handleConfirmClose}
        onConfirm={handleConfirmAction}
        message={confirmMessage}
        title={confirmTitle}
      />
      <ErrorModal
        display={displayError}
        onClose={handleErrorClose}
        message={errorMessage}
        title={errorTitle}
      />
      <NotifModal
        display={displayNotif}
        onClose={handleNotifClose}
        message={notifMessage}
        title={notifTitle}
      />
    </main>
  );
}
