"use strict";

// Example data
var events  = {
  eName: "Party Time",
  eHost: "Sylvester Cat",
  eLoc: "The Cage near the Window",
  eDateTime: "very SOON!"
};

var guests = {
  EID: 1,
  name: "Birdie",
  email: "avoid@theCat.com"
};

if (!window.indexedDB) {
  window.alert("Upgrade your browser if you want this to work");
}

// initialize global variables
var db
  , dbName = "InvitationList"
  , dbVersion = 1
  , dbStore = ["Events", "Guests"];

openDatabase();

// OPEN database
function openDatabase() {
  var request = window.indexedDB.open(dbName, dbVersion);

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
  };

  request.onsuccess = function(event) {
    console.log("open event", event.target);
    db = event.target.result;
    console.log("successfully opened the database", db);

    // get the invitation lists
    getInvitationLists();
  };

    request.onerror = function(event) {
    console.error("Y U NO give me access to database", event.target.error);
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
} //END getList

/**
 * Event Listeners:
 * @eventCreate
 * @addGuest
 * @uninviteGuest
 * @selectEvent
 */

function processEvent(eForm) {
    console.log("Processing Event");
    eForm.preventDefault();
    var eObj, evtStore, reqInx, request;

    eObj = {
      event: eForm.target.form.eName.value,
      host: eForm.target.form.hostName.value,
      location: eForm.target.form.where.value,
      dateTime: eForm.target.form.when.value
    };
    if (!(eObj.event && eObj.host && eObj.location && eObj.dateTime)){
      console.log("missing form information");
      alert("Please fill out the whole form");
      return;
    }

    getEvent(eObj, function(success) {
      if (success) {
        console.log("Event/dateTime already in database");
        alert("An event with the same name and time already exists.  Please add a new event and/or a new time.");
        return;
      }
      else {
        // Add event to DB
        addEventToDB(eObj, function(success) {
          if (success) {
            // Add event to DOM
            addEventToDOM(eObj);
            // Add the Event to selection option
            addEventToSelection(eObj.event, eObj.dateTime);
            return;
          }
        });
      }
    });
} //end processEvent

function processGuest(gForm) {
  console.log("Processing guests");
  gForm.preventDefault();
  var selEvt, selDT, eObj, form = gForm.target.form

  // get Selection
  selEvt = document.getElementById("fromEvents").options[fromEvents.selectedIndex].value;
  selDT = document.getElementById("fromDateTimes").options[fromDateTimes.selectedIndex].value;

  eObj = {
    event: selEvt,
    dateTime: selDT
  };

  // check that event and date coinside
  getEvent(eObj, function(success) {
    if (success) {
      var eGuest = {
        event: success.event,
        dateTime: success.dateTime,
        guest: {
          EID: success.EID,
          name: form.gName.value,
          email: form.gEmail.value
        }
      };
      getGuest(eGuest, function(success) {
        if (!success) {
          console.log("Adding Guest to Event");
          addGuestToDB(eGuest);
          return;
        }
        return;
      });
    }
    else {
      console.log("Event at that time does not exist");
      alert("There is no event at that time.  Please create a new event or change your selection.");
      return;
    }
  });
} //end processGuest

// get event
function getEvent(evt, callback) {
  console.log("Event", evt);
  var evtStore, reqInx, request;

  evtStore = getEvtStore(dbStore[0], "readonly");
  reqInx = evtStore.index("event");
  request = reqInx.count(evt.event);
  request.onsuccess = function(event) {
    var count = event.target.result;
    console.log("count", count);
    if (count) {
      request = reqInx.openCursor(evt.event);
      request.onsuccess = function(event) {
        var cursor = event.target.result;
        if (cursor) {
          if(cursor.value.event === evt.event && cursor.value.dateTime === evt.dateTime) {
            console.log("Event in DB");
            return callback(cursor.value);
          }
          cursor.continue();
        }
        else {
          return callback(false);
        }
      };
      request.onerror = function(event) {
        console.error("ERROR retrieving Event openCursor", event.target.error);
        return;
      };
    }
    else {
      console.log("No Event records");
      return callback(false);
    }
  };
  request.onerror = function(event) {
    console.error("ERROR retrieving Event count", event.target.error);
    return;
  };
} //end getEvent

// get guest
function getGuest(eGuest, callback) {
  console.log("getting guest", eGuest.guest);
  var guest = eGuest.guest;

  // first check if email is in the database
  var evtStore, reqInx, request;
  evtStore = getEvtStore(dbStore[1], "readonly");
  reqInx = evtStore.index("email");
  request = reqInx.count(guest.email);
  request.onsuccess = function(event) {
    var count = event.target.result;
    if (count) {
      request = reqInx.openCursor(guest.email);
      request.onsuccess = function(event) {
        var cursor = event.target.result;
        if (cursor) {
          if (cursor.value.name !== guest.name) {
            console.log("username does not match email");
            alert("Use a unique Name and Email for each guest");
            return callback(cursor.value);
          }
          if (cursor.value.EID === guest.EID){
            console.log("Guest already in the invite list.");
            alert("Guest already in the invite list.");
            return callback(cursor.value);
          }
          cursor.continue();
        }
        else {
          return callback(false);
        }
      };
      request.onerror = function(event) {
        console.error("ERROR retrieving Guest openCursor", event.target.error);
        return;
      };
    }
    else {
      console.log("No Guest records");
      return callback(false);
    }
  };
  request.onerror = function(event) {
    console.error("ERROR retrieving Guest count", event.target.error);
    return;
  };
} //end getGuest

// add event to DB
function addEventToDB(eObj, callback) {
  console.log("adding event to db");
  var transaction, evtStore, request;

  transaction = db.transaction(dbStore[0], "readwrite");
  evtStore = transaction.objectStore(dbStore[0]);
  request = evtStore.add(eObj);
  request.onsuccess = function(event) {
    var key = event.target.result;
    console.log("event added to db: key", key);
    return callback(key);
  };
  request.onerror = function(event) {
    console.error("ERROR adding Event to db", event.target.error);
    return;
  };
} //end addEventToDB

// add guest to DB
function addGuestToDB(eGuest) {
  console.log("adding guest to db", eGuest.guest);
  var evtStore, request;

  evtStore = getEvtStore(dbStore[1], "readwrite");
  request = evtStore.add(eGuest.guest);
  request.onsuccess = function(event) {
    var key = event.target.result;
    console.log("success on adding guest", event.target.result);
    addGuestsToDOM(eGuest);
    return;
  };
  request.onerror = function(event) {
    console.error("ERROR adding Guest to db:", event.target.error);
  };
} //end addGuest

// add event to selection options
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

// remove event from selection options
function removeEventFromSelection(eName, dateTime) {
  console.log("Removing Event from selection options");
  var fromEvents, fromDateTimes;

  // get selection options
  fromEvents = document.getElementById("fromEvents");
  fromDateTimes = document.getElementById("fromDateTimes");

  for (var i = 0, len = fromEvents.length; i < len; i++) {
    if (typeof fromEvents.options[i] !== "undefined" && fromEvents.options[i].value === eName) {
      fromEvents.remove(i);
    }
    if (typeof fromDateTimes.options[i] !== "undefined" && fromDateTimes.options[i].value === dateTime) {
      fromDateTimes.remove(i);
    }
  }
} //end removeEventFromSelection

// uninvite guest
function uninviteGuest(domGuest) {
  console.log("uninviting guest");

  // gather data
  var email, evtInfo, eObj;
  evtInfo = domGuest.target.parentNode.parentElement.id.split("_");
  email = domGuest.target.previousSibling.textContent;
  eObj = {
    event: evtInfo[0],
    dateTime: evtInfo[1],
    guest: {
      EID: "",
      email: email,
      li: domGuest.target.parentNode
    }
  };

  // get event
  getEvent(eObj, function(success) {
    if (success) {
      eObj.guest.EID = success.EID;
      removeGuestFromDB(eObj.guest);
      return;
    }
    else {
      console.log("Event not associated with guest");
      return;
    }
  });
} //end uninviteGuest

// --------------- HELPER FUNCTIONS ---------------
// get Event Store
function getEvtStore(name, mode) {
  var transaction = db.transaction(name, mode);
  return transaction.objectStore(name);
}
