#**e-Party: A IndexedDB Tutorial**

***Storage. Lots of it. On the client-side! IndexedDB is not your typical DOM Storage.  With the ability to store a large amount of data on the client-side, IndexedDB will usher a whole new method on web application architecture.  IndexedDB is an experimental technology with awesome powers. In this tutorial we will show how to implement the asynchronous IndexedDB API by applying it to an e-Party Invitation List manager.***

##**IndexedDB**
IndexedDB is not a relational database.  IndexedDB stores and retrieves objects that are indexed by a key.  Instead of rows, columns and tables IndexedDB has documents, fields and collections.  IndexedDB builds on the transactional database model, which states that every operation in IndexedDB happens within an atomic framework of a transaction.  IndexedDB is not a substitute for DOM Storage but rather a solution for storing large amounts of structured data on the client-side.  For more information on IndexedDB checkout [Basic Concepts](https://developer.mozilla.org/en-US/docs/IndexedDB/Basic_Concepts_Behind_IndexedDB).  

The focus of this tutorial will be on IndexedDB syntax being applied to a functional application. IndexedDB can be accessed via Firefox >= 16, Chrome >= 23 , and IE 10 ([caniuse](http://caniuse.com/#search=indexedDB)). This tutorial was tested in Firefox >= 16, Chrome >= 24 and IE 10. If you are using IE you need a server to get IndexedDB up and running since only `http` and `https` schemes are allowed access to IndexedDB


##**e-Party Application**
In this small tutorial we will be build and use a database named "Invitation List".  The application will allow a user to create and delete party events and keep track of guests that have been invited to the events.  The database will store two types of object stores: *Events* and *Guests*.  Documents belonging to the *Events* object store hold the fields event and host name, the location and time of the event.  A single document in the *Guests* object store contains a name, email and the event to which the guest was invited to attend.  Checkout the [demo!!!](file:///C:/Users/maoMao/Documents/webDev/JSPro/IndexedDB_Draft.html)

####**How it works**
A party planner wants to keep track of all scheduled events and invited guests.  The *e-Party* application uniquely identifies events by their name and time, and guests by their email address.  Any guest can be invited to multiple events but they cannot be added twice to the same event.  And guests can only be invited to events that are identifiable in the *Events* object store.  Finally, if an event or guest is removed from the DOM they are also deleted from the database.

Below is an example of the documents:
<script src="https://gist.github.com/0ac2cf1be69b10d161e2.js"></script>

##**Using IndexedDB**
The application tutorial shows how to use IndexedDB to connect to a database and perform read/write operations.  Many of the database operations we will cover follow a very common pattern: 

1. Open a transaction to an object store
2. Make a request to do some database operations
3. Do something with the results

But before we can engage in any database transaction we must first connect to a database.

####**Open a Database**
Below is the code that opens the e-Party *Invitation List* database:
<script src="https://gist.github.com/b6a6f4ec92c68a505084.js"></script>

To open the database a *request* is made to the [`open()`](https://developer.mozilla.org/en-US/docs/IndexedDB/IDBFactory#open) method via the [IDBFactory API](https://developer.mozilla.org/en-US/docs/IndexedDB/IDBFactory).  The method is passed two arguments: the database name and the version number.  If the database does not exist it is created.  The version number tracks the state of the database and since this is the first time accessing the database a verion number of `1` is given.  Note that only one version of the database can exist at any given time.  

The *request* returns an instance of [IDBOpenDBRequest](https://developer.mozilla.org/en-US/docs/IndexedDB/IDBOpenDBRequest) that provides the results of the request through `event.target.result`.  The result is a connection to the database through the [IDBDatabase API](https://developer.mozilla.org/en-US/docs/IndexedDB/IDBDatabase#createObjectStore).  The [`onupgradeneeded()`](https://developer.mozilla.org/en-US/docs/Mozilla_event_reference/upgradeneeded_indexedDB)    handler responds to the asynchronous `open()` operation when the database is accessed for the first time.

####**Create an Object Store**

The `onupgradeneeded()` is triggered only when there is a version change on the database or the database is first created.  Through the *IDBDatabase* interface the [`createObjectStore()`](https://developer.mozilla.org/en-US/docs/IndexedDB/IDBDatabase#createObjectStore) method is called to create the object stores where our data will be stored.  The `createObjectStore()` takes the name of the object store as the first parameter and an second optional object parameter.  

There are [three techniques](https://developer.mozilla.org/en-US/docs/IndexedDB/Basic_Concepts_Behind_IndexedDB#key) to create an object store key: a `key path`, a `key generator` or explicitly specified value.  And [four possible](https://developer.mozilla.org/en-US/docs/IndexedDB/Using_IndexedDB#Structuring_the_database) ways to structure object stores through the optional object parameter. 

The `key path` is the equivalent of a *primary key* in a relational DB. The `key generator` creates keys in ordered sequence.  And if there is no `key generator` then the application must assign a unique key to the records.  In our application we provide a key name and let IndexedDB `autoIncrement` the key value.

When the object store is created the returned result is an [IDBObjectStore](https://developer.mozilla.org/en-US/docs/IndexedDB/IDBObjectStore) object.  It is this object that provides the interface to the database to read and write.  The *IDBOjectStore* also has a method [`createIndex()`](https://developer.mozilla.org/en-US/docs/IndexedDB/IDBObjectStore#createIndex%28%29) that creates indexes on the object store fields.  Besides providing for a quick lookup the method also allows for data value constraints.  

`createIndex()` takes three parameters: the name of the index, a key path of the field and an optional object.  The optional object has a `unique` property, which when set to false allows the index to have duplicate values.  Although the `createIndex()` method is optional its a good idea to use it to outline a schema.

After creating the object stores the `onsuccess` handler is triggered and finalizes our connection to the database.  If at any time an error is encounterd the `onerror` handler responds.  Now that we have the database up and running we are ready to interact with the database.

####**Transactions**
At this point the user will interact with the application by scheduling events and inviting guests.  Before adding the event information into the database we first process the event against our predefined constraints and if everything checks-out we add it to the database.  As metioned above, reading and writing in IndexedDB follows a very common pattern:

1. **Open a transaction to an object store**
2. **Make a request to do some database operations**
3. **Do something with the results**

The first step in the application constraint is making sure the event added is not already in the database.  The function below outlines the procedure:

**`getEvent`**  
<script src="https://gist.github.com/3b74c0699e9de57f5848.js"></script>

The only way to access a database for reading and writing is through the *IDBDatabase* [`transaction()`](https://developer.mozilla.org/en-US/docs/IndexedDB/IDBDatabase#transaction) method.  All transactions are atomic and once insided an atomic transaction access is given to a specified object store.  It is within this *scope* that reading and writing is conducted.  

To open a `transaction()` on an *IDBDatabase* object we specifiy a scope by name and a mode.  The mode determines how object stores are accessed with the *transaction*. There are only three modes allowed:

1. readonly ---- read access to the db
2. readwrite ---- read and write access to the db
3. versionchange ---- create/modify the object store

In the `getEvent()` our *transaction scope* is over `Events` with a mode of '*readonly*'.  If no mode is specified the default is '*readonly*'.  The returned result is the [IDBTranscation](https://developer.mozilla.org/en-US/docs/IndexedDB/IDBTransaction) object.  Once within this *transaction scope* the [`objectStore()`](https://developer.mozilla.org/en-US/docs/IndexedDB/IDBObjectStore) method is called to request access to the `Events` object store and returns a [IDBObjectStore](https://developer.mozilla.org/en-US/docs/IndexedDB/IDBObjectStore) object `evtStore` that references the object store for the coming query.

A typical query calls the [`get()`](https://developer.mozilla.org/en-US/docs/IndexedDB/IDBObjectStore#get%28%29) method on the object store but that assumes we know the value of the `key path`.  From the `onupgradeneeded()` above we let IndexedDB handle assigning key values so we do not know the events `key path` value before hand.  What we do instead is call the [`index()`](https://developer.mozilla.org/en-US/docs/IndexedDB/IDBObjectStore#index%28%29) method, which allows us to directly query the name of the index `event` of the object store.

##StartHereNextTime
Before directly querying for the event name the code above has a series of checks that can be helpful at targeting specific queries in IndexedDB.  The first check is the `count()` method on the indexed object store `reqInx`.  The result is a number signifying how many records have the event name.  If the number is zero we know immediately no such record exists and can proceed to adding the record to the database.  On the other hand, if a number greater than zero is returned we proceed to the next step which is getting the record and performing the second check.  

We know that a certain number of records exist with the given event name.  We extract those records by using the [`openCursor()`](https://developer.mozilla.org/en-US/docs/IndexedDB/IDBObjectStore#openCursor%28%29) method on `reqInx`, which creates a cursor over the records.  Regardless if a record exists or not the `onsuccess` handler is triggered.  Checking if the cursor exists gives us an added option to control what happens next.  If a cursor exists we get the cursor value and check the record against the user input.  If the check passes we know that the user added event already exists in the database and we return that record.  If the check fails we call `cursor.continue()` to iterate the cursor.  We continue in this fashion until we find a cursor value that matches or until the cursor runs out of records to check, in which returns `null`.  In the event `null` we return `false` and proceed to add the event into the database.

<script src="https://gist.github.com/76c5846bd2113970d89d.js"></script>

To add the event to the database we setup a transaction of scope `Events` and a mode of 'readwrite'.  We target the `Events` object store and then call the [`add()`](https://developer.mozilla.org/en-US/docs/IndexedDB/IDBObjectStore#add%28%29) method.  The `onsuccess` event is triggered and the key used to store the event is returned.

###**Working with Errors**
Now that we know how reading and writing looks like in IndexedDB let's take a step back and talk about *errors*.  Every asynchronous operation returns an [IDBRequest](https://developer.mozilla.org/en-US/docs/IndexedDB/IDBRequest) instance that returns a *result* and an *error*.  Depending if the *request* object is successful determines if the handler `onsuccess` or `onerror` is triggered.  Looking back at our code for every *request* made there is a pair of `onsuccess` and `onerror` handlers.  

Note that the 'get()' and 'delete()' objectStore methods trigger the `onsuccess` handler regardless if a record exists to retrieve or to delete.  By using the `cursor` method described above you can distinguish between a record existing or not.  If you want to check if a key exists before deleting the record you can check that it exists and then delete.  The latter is demonstrated later in this tutorial.

###**Adding Guests**
At this point the user has successfully added various events to the e-Party Invitation List and now wishes to add invited guests to specific events.  The user selects an event and a time to add a guest to and then inputs a guest name and a unique email.  Recieving the user input the next step is to verify that the event and time selected coincide.  Then to check if the email is unique and that the guest is not already on the list.

**processGuest**
<script src="https://gist.github.com/f1bffe23b8a3823e9d4b.js"></script>

Checking for the event has been discussed above.  Suffice to say that if a `cursor.value` is not returned then the alert is triggered and we start over.

**getGuest**
<script src="https://gist.github.com/a765d52cea1434d62d2a.js"></script>

The `getGuest()` is exactly the same as the `getEvent()` function.  We use `count()` and `openCursor()` to check if the email and name coinside.  If they do coinside we proceed to check that the guest is not already in the list by checking the `EID`'s.  If at any time 'true' is returned an alert is triggered letting the user know that the guest email is taken or the guest is already on the list.  If 'false' is returned we proceed to adding the guest into the database.

**addGuestToDB**
<script src="https://gist.github.com/3abd8d6ad90697c43a23.js"></script>

No surprise that the function looks exactly the same as the `addEventToDB()` except here the transaction is over the `Guests` scope.

###**Deleting Events and Guests**
Our application has two ways to delete guests from the database.  The user can individually select which guest to 'uninvite' from an event or the user can completely remove an event which also removes associated guests.  Both cases follow the same pattern in deleteing data from the database.  We focus here on the removal of the event and associated guests.

<script src="https://gist.github.com/b29021e6ea748472b17e.js"></script>

The `delete()` method of the *objectStore* accepts as input the key identifying the record to delete.  When the user *clicks* to remove an event we retrieve the event key by calling the `getEvent()` function.  Opening a transaction with mode "readwrite" and calling 'delete()' on the objectStore we delete the event from the database.  `onsuccess` we pass the event key `EID` to identify which guests belong to the event and delete them from the database.

<script src="https://gist.github.com/e106a0aac36e4f7ef0b7.js"></script>

Scoping the transaction to the `Guests` objectStore and calling `index()` on the key `EID` we open a cursor that iterates over all guests that belong to the event.  For every guest returned by the cursor the `delete()` method is used on the guest key `GID`.  The `onsuccess` is triggered for every successful deletion and if there are any problems the `onerror` handler will notify.

##**Conclusion**

IndexedDB is an alternative to DOMStorage for applications that have large storage requirements for structured data.  The syntax for working with IndexedDB is straight-forward and creating general functions that `get()`, `add()` and `delete()` make IndexedDB get out the way and focus on developing your application without worrying about storage space.