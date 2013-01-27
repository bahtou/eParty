(function() {
  "use strict";

  if (!window.indexedDB) {
    window.alert("Upgrade your browser if you want this to work");
  }

  // -----------------------------------------------------------------------
  // DOM and DB functions
  // -----------------------------------------------------------------------
  // add Event Elements to DOM
  function addEventToDOM(evtInfo) {
    console.log("adding Event to DOM", evtInfo);
    var mainInvList, mainEvt, eInfo, eName, eHost, eLOC, eDate, eNameH1, eHostH4, eHostH3, eLOCH4, eLOCp, eDateH4, eDatep, section, h3, hgroup, hgroupH41, hgroupH42, ol, remove;

    // create DOM elements
    mainInvList = document.getElementById("mainInvList");

    mainEvt = document.createElement("div");
    eInfo = document.createElement("hgroup");
    eName = document.createElement("div");
    eNameH1 = document.createElement("h1");
    eHost = document.createElement("div");
    eHostH4 = document.createElement("h4");
    eHostH3 = document.createElement("h3");
    eLOC = document.createElement("div");
    eLOCH4 = document.createElement("h4");
    eLOCp = document.createElement("p");
    eDate = document.createElement("div");
    eDateH4 = document.createElement("h4");
    eDatep = document.createElement("p");
    remove = document.createElement("button");

   // setAttributes to elements
    // mainEvent
    mainEvt.setAttribute("id", evtInfo.event + "_" + evtInfo.dateTime); // .replace(/\s/g, "").toLowerCase() -- .toString().replace(/\s/g, "")
    mainEvt.setAttribute("class", "event");
     // hgroup
    eInfo.setAttribute("class", "eInfo");
     // eName
    eName.setAttribute("id", evtInfo.event.replace(/\s/g, "").toLowerCase());
    eName.setAttribute("class", "eName");
     // eHost
    eHost.setAttribute("id", evtInfo.host.replace(/\s/g, "").toLowerCase());
    eHost.setAttribute("class", "eHost");
     // eLOC
    eLOC.setAttribute("id", evtInfo.location.replace(/\s/g, "").toLowerCase());
    eLOC.setAttribute("class", "eLOC");
     // eDate
    eDate.setAttribute("id", evtInfo.dateTime.toString().replace(/\s/g, ""));
    eDate.setAttribute("class", "eDate");
     // close button
     remove.setAttribute("id", evtInfo.event + "_" + evtInfo.dateTime + "_remove");
     remove.setAttribute("class", "btn btn-mini btn-inverse evtRemove");
     remove.setAttribute("type", "submit");

    // bind values to Elements
    eNameH1.innerHTML = evtInfo.event;
    eHostH4.innerHTML = "Hosted by ";
    eHostH3.innerHTML = evtInfo.host;
    eLOCH4.innerHTML = "Location";
    eLOCp.innerHTML = evtInfo.location;
    eDateH4.innerHTML = "Date";
    eDatep.innerHTML = evtInfo.dateTime;
    remove.innerHTML = "remove event";

    // append to the Elements
    eName.appendChild(eNameH1);
    eInfo.appendChild(remove);
    eInfo.appendChild(eName);

    eHost.appendChild(eHostH4);
    eHost.appendChild(eHostH3);
    eInfo.appendChild(eHost);

    eLOC.appendChild(eLOCH4);
    eLOC.appendChild(eLOCp);
    eInfo.appendChild(eLOC);

    eDate.appendChild(eDateH4);
    eDate.appendChild(eDatep);
    eInfo.appendChild(eDate);
     // append hgroup to mainInvt
    mainEvt.appendChild(eInfo);

    // create the guest block
    section = document.createElement("section");
    h3 = document.createElement("h3");
    hgroup = document.createElement("hgroup");
    hgroupH41 = document.createElement("h4");
    hgroupH42 = document.createElement("h4");
    ol = document.createElement("ol");

    // setAttributes to Elements
    // section.setAttribute("id", evtInfo.event.replace(/\s/g, "").toLowerCase() + evtInfo.dateTime.toString().replace(/\s/g, "") + "_glist");
    section.setAttribute("class", "eList");
    hgroup.setAttribute("class", "guestsNameEmail");
    ol.setAttribute("id", evtInfo.event + "_" + evtInfo.dateTime + "_gList"); //.toString().replace(/\s/g, "") -- .replace(/\s/g, "").toLowerCase() 
    ol.setAttribute("class", "guestList");

    // bind values to Elements
    h3.innerHTML = "Invited Guests";
    hgroupH41.innerHTML = "Name";
    hgroupH42.innerHTML = "Email";

    // append to Elements
    section.appendChild(h3);
    hgroup.appendChild(hgroupH41);
    hgroup.appendChild(hgroupH42);
    section.appendChild(hgroup);
    section.appendChild(ol);
     // append section to mainEvt
    mainEvt.appendChild(section);

    // append mainEvt mainInvtList
    mainInvList.appendChild(mainEvt);

    // add Listener to event
    var evtRemove = document.getElementById(evtInfo.event + "_" + evtInfo.dateTime + "_remove");
    evtRemove.addEventListener("click", removeEventFromDB, false);

    console.log("finished adding Event to DOM");
  } // end addEventToDOM

  // add Guest Elements to DOM
  function addGuestsToDOM(eGuest) {
    console.log("adding guest to DOM");
    var li, spanName, spanEmail, button, ol, uninvite;

    ol = document.getElementById(eGuest.event + "_" + eGuest.dateTime + "_gList"); //.replace(/\s/g, "").toLowerCase() -- .toString().replace(/\s/g, "") 

    var guest = eGuest.guest;
    console.log("guest", guest);

    li = document.createElement("li");
    spanName = document.createElement("span");
    spanEmail = document.createElement("span");
    button = document.createElement("button");

    spanName.setAttribute("class", "list name");
    spanEmail.setAttribute("class", "list email");
    button.setAttribute("id", eGuest.event + "_"+ eGuest.dateTime + "_" + guest.email);
    button.setAttribute("class", "btn btn-danger btn-small uninvite");
    button.setAttribute("type", "submit");

    spanName.innerHTML = guest.name;
    spanEmail.innerHTML = guest.email;
    button.innerHTML = "unInvite";

    li.appendChild(spanName);
    li.appendChild(spanEmail);
    li.appendChild(button);
    ol.appendChild(li);

    // register event listener
    uninvite = document.getElementById(eGuest.event + "_"+ eGuest.dateTime + "_" + guest.email);
    uninvite.addEventListener("click", uninviteGuest, false);

    console.log("finished adding Guest to DOM");
  } // end addGuestToDOM

  // remove Guest from DB
  function removeGuestFromDB(guest) {
    console.log("removing guest from DB");
    if (typeof guest === "number") {
      console.log("removing all guests");

      var gStore, reqInx, request;
      gStore = getEvtStore(dbStore[1], "readwrite");
      reqInx = gStore.index("EID");
      request = reqInx.openCursor(guest);
      request.onsuccess = function(event) {
        var cursor = event.target.result;
        if (cursor) {
          request = gStore.delete(cursor.value.GID);
          request.onsuccess = function(event) {
            console.log("evt:", event);
            console.log("evt.target:", event.target);
            console.log("evt.target.result:", event.target.result);
            console.log("delete successful");
            return;
          };
          request.onerror = function(event) {
            console.error("Error deleting guest from DB", event.target.error);
            return;
          };
          cursor.continue();
        }
        else {
          console.log("done removing guests");
          return;
        }
      };
      request.onerror = function(event) {
        console.error("Error retreiving guest for remove from DB", event.target.error);
        return;
      };
    }
    else {
      var evtStore, reqInx, request;

      evtStore = getEvtStore(dbStore[1], "readwrite");
      reqInx = evtStore.index("EID");
      request = reqInx.openCursor(guest.EID);
      request.onsuccess = function(event) {
        var cursor = event.target.result;
        if (cursor) {
          if(cursor.value.email === guest.email) {
            console.log("guest identified");

            // delete guest here
            request = evtStore.delete(cursor.value.GID);
            request.onsuccess = function(event) {
              console.log("evt:", event);
              console.log("evt.target:", event.target);
              console.log("evt.target.result:", event.target.result);
              console.log("delete successful");
              removeGuestFromDOM(guest);
              return;
            };
            request.onerror = function(event) {
              console.error("ERROR removing guest from DB:", event.target.error);
              return;
            };
          }
          cursor.continue();
        }
        else {
          console.log("done deleting guest"); 
          return;
        }
      };
      request.onerror = function(event) {
        console.log("Error getting email on removeGuest", event.target.error);
        return;
      };
    }
  } //end removeGuestFromDB

  // remove Guest Elements from guest
  function removeGuestFromDOM(guest) {
    console.log("removing guest from DOM");
    // from parentNode remove list child
    guest.li.parentNode.removeChild(guest.li);
    console.log("finished removing guest from DOM");
  } // end removeGuestFromDOM

  // remove event along with possible guests from the DataBase
  function removeEventFromDB(event) {
    event.preventDefault();
    console.log("begin removing event");
    var evt, evtStore, reqInx, request, eName, eDT;

    evt = event.target.id.split("_");
    console.log("event to remove:", evt);

    evtStore = getEvtStore(dbStore[0], "readwrite");
    reqInx = evtStore.index("event");
    request = reqInx.openCursor(evt[0]);
    request.onsuccess = function(event) {
      var cursor = event.target.result;
      if (cursor) {
        if (cursor.value.dateTime === evt[1]) {
          var EID;
          EID = cursor.value.EID;
          eName = cursor.value.event;
          eDT = cursor.value.dateTime;
          request = evtStore.delete(EID);
          request.onsuccess = function(event) {
            console.log("evt:", event);
            console.log("evt.target:", event.target);
            console.log("evt.target.result:", event.target.result);
            console.log("delete successful");
            removeGuestFromDB(EID);
            return;
          };
          request.onerror = function(event) {
            console.error("ERROR deleting event from DB: ", event.target.error);
            return;
          };
        }
        cursor.continue();
      }
      else {
        console.log("Done deleting event");
        removeEventFromDOM(eName, eDT);
        return;
      }
    };
    request.onerror = function(event) {
      console.error("ERROR getting event to remove: ", event.target.error);
      return;
    };
    return;
  }

  // remove event from the DOM
  function removeEventFromDOM (eName, eDateTime) {
    console.log("Removing event from DOM");
    var evt = document.getElementById(eName + "_" + eDateTime);
    evt.parentNode.removeChild(evt);
    return;
  } //end removeEventFromDOM
// -----------------------------------------------------------------------
// -----------------------------------------------------------------------

  // initialize global variables
  var db
    , dbName = "InvitationList"
    , dbVersion = 1
    , dbStore = ["Events", "Guests"];

  var exEvents, exGuests;
  exEvents = [
    {
      event: "DownTown Get Together",
      host: "Bethany Almonds",
      location: "Luckys Bar and Grill",
      dateTime: new Date().getTime()
    },
    {
      event: "Boo's Birthday Get Together",
      host: "Helena Montes",
      location: "457 S. Brown Wood st.",
      dateTime: new Date().getTime()
    }
  ];

  exGuests = [
        {
          name: "Rodrigo Montoya",
          email: "hotRod@garage.com"
        },
        {
          name: "Mao Jenkins",
          email: "catFun@treats.com"
        },
        {
          name: "Jerry Kid",
          email: "lossy@moJo.com"
        },
        {
          name: "Hessgar Ium",
          email: "unaBosh@tuna.com"
        }
  ];

  openDatabase();

  // OPEN database
  function openDatabase() {
    var request = window.indexedDB.open(dbName, dbVersion);

    request.onerror = function(event) {
      console.error("Y U NO give me access to database", event.target.error);
    };
    request.onsuccess = function(event) {
      console.log("open event", event.target);
      db = event.target.result;
      console.log("successfully opened the database", db);
      
      // get the invitation lists
      getInvitationLists();

    };
    request.onupgradeneeded = function(event) {
      console.log("database upgrade needed", event);
      db = event.target.result;

      // create Events
      var EventsObjectStore = db.createObjectStore(dbStore[0], {keyPath: "EID", autoIncrement: true});
      EventsObjectStore.createIndex("event", "event", {unique: false});
      EventsObjectStore.createIndex("host", "host", {unique: false});
      EventsObjectStore.createIndex("location", "location", {unique: false});
      EventsObjectStore.createIndex("dateTime", "dateTime", {unique: false});
      // create Guests
      var GuestObjectStore = db.createObjectStore(dbStore[1], {keyPath: "GID", autoIncrement: true});
      GuestObjectStore.createIndex("EID", "EID", {unique: false});
      GuestObjectStore.createIndex("name", "name", {unique: false});
      GuestObjectStore.createIndex("email", "email", {unique: false});

      // console.log("adding examples");
      // var request;
      // for (var i in exampleData) {
      //   try {
      //     request = EventsObjectStore.add(exampleData[i]);
      //   } catch(e) {
      //     if (e.name == 'DataCloneError')
      //       console.error("insertion error");
      //     throw e;
      //   }
      //   console.log("data added");
      // }
    };
  } //END openDatabase

  // register EventListeners
  function registerEventListeners() {
    console.log("adding listeners");
    var create, add, eHover;

    create = document.getElementById("create");
    add = document.getElementById("add");
    // eHover = document.getElementsByClassName("eInfo");

    create.addEventListener("click", processEvent, false);
    add.addEventListener("click", processGuest, false);
    // eHover.addEventListener("hover", showRemove, false);

    console.log("done registering EventListeners");
    return;
  } //end register event listener

  // GET invitation list
  function getInvitationLists() {
    var objStore, keyRange, cursor, request, transaction;

    // get data from event store
    transaction = db.transaction(dbStore[0], "readonly");
    objStore = transaction.objectStore(dbStore[0]);
    keyRange = IDBKeyRange.lowerBound(0);
    request = objStore.openCursor(keyRange);

    request.onsuccess = function(event) {
      console.log("Retreiving event/guest lists");
      cursor = event.target.result;
      if (cursor) {
        var obj = cursor.value;
        // add event to DOM
        addEventToDOM(obj);
        addEventToSelection(obj.event, obj.dateTime);

        // get guest, if any
        var guestStore, gIndex, gCursor, gRequest;
        guestStore = getEvtStore(dbStore[1], "readonly");
        gIndex = guestStore.index("EID");
        gRequest = gIndex.openCursor(obj.EID);
        gRequest.onsuccess = function(event) {
          var cursor = event.target.result;
          if (cursor) {
            // add guest to DOM
            obj.guest = cursor.value;
            addGuestsToDOM(obj);
            cursor.continue();
          }
          else {
            console.log("done getting guests");
            return;
          }
        };
        gRequest.onerror = function(event) {
          console.error("ERROR retreiving guest data", event.target.error);
          return;
        };
        cursor.continue();
      }
      else {
        console.log("done getting events");
        registerEventListeners();
        return;
      }
    };
    request.onerror = function(event) {
      console.error("Error reading event data:", event.target.error);
      return;
    };

    transaction.oncomplete = function(event) {
      console.log("transaction complete");
      return;
    };
  } //END getList

  /**
   * Event Listeners:
   * @eventCreate
   * @addGuest
   * @uninviteGuest
   * @selectEvent
   */

  function processEvent(event) {
      console.log("creating event");
      event.preventDefault();
      var eventObj, evtStore, reqInx, request;

      eventObj = {
        event: event.target.form.eName.value,
        host: event.target.form.hostName.value,
        location: event.target.form.where.value,
        dateTime: event.target.form.when.value
      };
      if (!(eventObj.event && eventObj.host && eventObj.location && eventObj.dateTime)){
        console.log("missing form information");
        alert("Please fill out the whole form");
        return;
      }

      console.log("event to add", eventObj);
      // First check if event+dt are not already in db
      evtStore = getEvtStore(dbStore[0], "readonly");
      reqInx = evtStore.index("event");
      request = reqInx.openCursor(eventObj.event);

      request.onsuccess = function(event) {
        var cursor = event.target.result;
        if (cursor) {
          console.log("list events in db", cursor.value.event);
          if (cursor.value.event === eventObj.event && cursor.value.dateTime === eventObj.dateTime) {
            console.log("Event/dateTime already in database");
            alert("An event with the same name and time already exists.  Please add a new event and/or a new time.");
            return;
            }
          cursor.continue();
        }
        else {
          console.log("cursor done: ", "Proceed to insert Event/dateTime into db");
          // First, add event to DB
          addEventToDB(eventObj);
          // Then add event to DOM
          addEventToDOM(eventObj);
          // Lastly, add the new event and time to the Event and Date/Time tag selection
          addEventToSelection(eventObj.event, eventObj.dateTime);
          return;
        }
      };
      request.onerror = function(event) {
        console.error("Error adding New Event", event.target.error);
        return;
      };
  } //end processEvent

  function processGuest(guestForm) {
    guestForm.preventDefault();
    console.log("processing guests", guestForm);
    var form = guestForm.target.form;

    var selEvt, selDT, EID, fromEvents, fromDateTimes;

    // get Elements
    fromEvents = document.getElementById("fromEvents");
    fromDateTimes = document.getElementById("fromDateTimes");

    selEvt = fromEvents.options[fromEvents.selectedIndex].value;
    selDT = fromDateTimes.options[fromDateTimes.selectedIndex].value;

    // check that event and date coinside
    chkEvtTime(selEvt, selDT, form);
  } //end processGuest

  // add event to the database
  function addEventToDB(eventObj) {
    console.log("adding event to db");
    var evtStore, request;

    evtStore = getEvtStore(dbStore[0], "readwrite");
    request = evtStore.add(eventObj);
    request.onsuccess = function(event) {
      var value = event.target.result;
      if (value) {
        console.log("event added to db", event.target);
        return;
      }
    };
    request.onerror = function(event) {
      console.error("problem inserting event into db");
      return;
    };
  } //end addEventToDB

  // add event created to the available selections
  function addEventToSelection(eName, dateTime) {
    console.log("adding to selection");
    var fromEvents, fromDateTimes, optionE, optionDT;

    fromEvents = document.getElementById("fromEvents");
    fromDateTimes = document.getElementById("fromDateTimes");

    optionE = document.createElement("option");
    optionDT = document.createElement("option");

    optionE.setAttribute("value", eName);
    optionE.innerHTML = eName;
    optionDT.setAttribute("value", dateTime);
    optionDT.innerHTML = dateTime;

    fromEvents.appendChild(optionE);
    fromDateTimes.appendChild(optionDT);
    return;
  } //end addEventToSelection

  function chkEvtTime(evt, dt, form) {
    var evtStore, reqInx, request;
    evtStore = getEvtStore(dbStore[0], "readonly");
    reqInx = evtStore.index("event");
    request = reqInx.openCursor(evt); // get events

    request.onsuccess = function(event) {
      var cursor = event.target.result;
      if (cursor) {
        console.log("checking event/time", cursor.value.event, cursor.value.dateTime);
        if (cursor.value.dateTime === dt) {
          console.log("event/time checkout");
          return chkGuest(cursor.value, form);
        }
      cursor.continue();
      }
      else {
        console.log("Event at that time does not exist");
        alert("There is no event at that time.  Please create a new event or change your selection.");
        return;
      }
    };
    request.onerror = function(event) {
      console.error("unable to get Event: db get error", event.target.error);
      return;
    };
  } //end chkEvtTime

  function chkGuest(evtInfo, form) {
    console.log("event info: ", evtInfo);

    // create guest object
    var eventGuest = {
      event: evtInfo.event,
      dateTime: evtInfo.dateTime,
      guest: {
        EID: evtInfo.EID,
        name: form.gName.value,
        email: form.gEmail.value
      }
    };
    console.log("guest object", eventGuest.guest);

    // // first check if email is in the database
    var evtStore, reqInx, request;
    evtStore = getEvtStore(dbStore[1], "readonly");
    reqInx = evtStore.index("email");
    request = reqInx.openCursor(eventGuest.guest.email);

    request.onsuccess = function(event) {
      console.log("retrieving data");
      var cursor = event.target.result;

      if (cursor) {
        console.log("checking against guest", cursor.value.EID, cursor.value.name, cursor.value.email);
        if (cursor.value.name !== eventGuest.guest.name) {
          console.log("username does not match email");
          alert("Use a unique Name and Email for each guest");
          return;
        }
        if (cursor.value.EID === eventGuest.guest.EID){
          console.log("Guest already in the invite list.");
          alert("Guest already in the invite list.");
          return;
        }
        cursor.continue();
      }
      else {
        console.log("adding event/user to db");
        addGuestToDB(eventGuest);
        return;
      }
    };
    request.onerror = function(event) {
      console.error("db cursor guest error", event.target.error);
    };
  } //end chkGuest

  // add guest to DB
  function addGuestToDB(eGuest) {
    console.log("adding guest to db",eGuest);
    var evtStore, request;

    evtStore = getEvtStore(dbStore[1], "readwrite");
    request = evtStore.add(eGuest.guest);
    request.onsuccess = function(event) {
      var value = event.target.result;
      if (value) {
        console.log("success on adding guest", event.target);
        addGuestsToDOM(eGuest);
        return;
      }
      console.error("guest not added to db", event.target);
    };
    request.onerror = function(event) {
      console.error("guest insertion error:", event.target.error);
    };
  } //end addGuest

  // uninvite guest
  function uninviteGuest(domGuest) {
    console.log("uninviting guest");

    // gather data
    var email, evtInfo, guest, evtStore, reqInx, request;
    evtInfo = domGuest.target.parentNode.parentElement.id.split("_");
    email = domGuest.target.previousSibling.textContent;
    guest = {
      EID: "",
      event: evtInfo[0],
      email: email,
      li: domGuest.target.parentNode
    };

    // get event 
    evtStore = getEvtStore(dbStore[0], "readonly");
    reqInx = evtStore.index("event");
    request = reqInx.openCursor(evtInfo[0]);
    request.onsuccess = function(event) {
      var cursor = event.target.result;
      if (cursor) {
        if (cursor.value.dateTime === evtInfo[1]) {
          console.log("event/dateTime identified");
          guest.EID = cursor.value.EID;
          removeGuestFromDB(guest);
          return;
        }
        cursor.continue();
      }
      else {
        console.log("Event not associated with guest");
        return;
      }
    };
    request.onerror = function(event) {
      console.error("ERROR accessing event from DB:", event.target.error);
      return;
    };
  } //end uninviteGuest

  // --------------- HELPER FUNCTIONS ---------------
  // get Event Store
  function getEvtStore(name, mode) {
    var transaction = db.transaction(name, mode);
    return transaction.objectStore(name);
  }

})();
