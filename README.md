#**A Tutorial in Applying IndexedDB**

***Storage. Lots of it. On the client-side! IndexedDB is not your typical DOM Storage.  With the ability to store (with user permission) a large amount of data on the client-side, IndexedDB will usher a whole new method on web application architecture.  IndexedDB is an experimental technology with awesome powers. In this tutorial we will show how to implement the asynchronous IndexedDB API by applying it to an E-Party Invitation List Manager.***

##**Background**
IndexedDB is not a relational database.  Instead of collections of tables the database has collections of object stores, and within these stores data is persisted as key-value pairs.  IndexedDB is not a substitute for DOM Storage but rather a solution for storing large amounts of structured data on the client-side.

In this tutorial we will be building a small database named "Invitation List" that will help manage an E-Party Invitation List.  A user will be able to create/delete events and keep track of guests that have been invited/uninvited to events. The database will store two types of object stores: Events and Guests. Events will consists of event name, host name, location and time of the event. Guests will contain names, emails and the event to which they were invited to attend.

The focus of this tutorial will be on syntax implementation of IndexedDB. IndexedDB can be accessed with Firefox >= 16, Chrome >= 23 , and IE 10 ([caniuse](http://caniuse.com/#search=indexedDB)). This tutorial was tested in Firefox >= 16, Chrome >= 24 and IE 10. If you are using IE you need a server to get IndexedDB up and running since only `http` and `https` schemes are allowed access to IndexedDB


##**For Starters**
The basic pattern encouraged for working with [IndexedDB](https://developer.mozilla.org/en-US/docs/IndexedDB/Using_IndexedDB#pattern) is:

1. Open a Database
2. Create an object store
3. Make a request to do some database operations
4. Wait for the operation to complete
5. Do something with the results

###**Open/Create a Database**
Before we attempt to access IndexedDB lets create some global variables to reference our database and object stores:
<script src="https://gist.github.com/3a0499619184e1f04771.js"></script>

Now lets get the database up and running.

<script src="https://gist.github.com/b6a6f4ec92c68a505084.js"></script>

To open the database we must make a *request* to [open()](https://developer.mozilla.org/en-US/docs/IndexedDB/IDBOpenDBRequest) by passing two arguments, the database name and the version number.  The version number makes it possible to update the schema of the database, and only one version of the database can exist at any given time. 

Before opening the database the user will be prompted for access to the database.  If the user refuses the `request.onerror` handler will be triggered.  If this is the first time the user allows access then `request.onupgradeneeded` will initiate the creation of the object stores.

###**Create an Object Store**

The `upgradeneeded` is only triggered when the database is first created and when there is a version change.  The result returns a [IDBDatabase](https://developer.mozilla.org/en-US/docs/IndexedDB/IDBDatabase) object, which we need to connect to throughout the application.  With the `createObjectStore()` method we setup our two application object stores. 

There are [four possible](https://developer.mozilla.org/en-US/docs/IndexedDB/Using_IndexedDB#Structuring_the_database) ways to structure the object stores using `key path` and `key generator`.  The `key path` is the equivalent of a *primary key* in a relational DB. The `autoIncrement: true` specifies that we want IndexedDB to increment our keys automatically as we insert values into the object store.  

With the [IDBObjectStore](https://developer.mozilla.org/en-US/docs/IndexedDB/IDBObjectStore) object we can apply indexes to the object store values.  Besides providing for a quick lookup the `createIndex()` method also allows for data value constraints.  The properties given state the *name* and *key path* of the index and the boolean property `unique`.  Although the `createIndex()` method is optional its a good idea to use it to outline your schema.

After creating the object stores the `request.onsuccess` handler is triggered. Now that we have the database up and running we are ready to interact with the database.

###**3. Make a request to do some database operations, 4. Wait for the operation to complete and then 5. Do something with the results**

At this point our user will schedule events and invite guests.  In our application the user must fill out the whole form and satisfy the constraint that no two events can have the same name and time.  Also, no two guests can have the same email and a guest cannot be added twice to an event.

**getEvent:**  
<script src="https://gist.github.com/3b74c0699e9de57f5848.js"></script>

[Transactions](https://developer.mozilla.org/en-US/docs/IndexedDB/IDBTransaction) are the only way to read/write data to a database.  There are only three modes that allow any interaction with the database:

1. readonly ---- read access to the db
2. readwrite ---- read and write access to the db
3. versionchange ---- create/modify the object store

The two parameters of the transaction defines the *scope* over which object stores the transaction can access and the mode of the transaction.  Since we are first checking to make sure the event is unique a mode of 'readonly' suffices.  Note that the default mode is `readonly` if no mode is specified. The [objectStore](https://developer.mozilla.org/en-US/docs/IndexedDB/IDBObjectStore) method returns the `Events` object store establishing a reference for the coming query.  

Using `.count()` before a specific search returns the number of records that are associated with the index.  If it is zero we know immediately that the input is not in the database and we can insert it into the database.  If there are records returned we must check them against the input.  Using `count()` is helpful because the `onsuccess` handler is triggered regardless if a record is found or not.  By providing the additional step we can be confident that we get the results we expect.

There are two methods of the `objectStore` that we can use to retrieve data from the database: `get()` and `openCursor()`.  The `get()` method returns a single record even  if there are multiple records with the same event name.  On the other hand, the `openCursor()` method iterates over all the records in the object store6. To bound the query we use an index to search for a particular event name. Recall from above the given `key path` name for the event.  Now the `openCursor` will only return those records that satisfy the name.

The `openCursor()` returns an [IDBRequest](https://developer.mozilla.org/en-US/docs/IndexedDB/IDBRequest) object with results that are stored in a cursor object. The cursor object only references one record at a time. If that record is found to be the same as the user input then the user is alerted to the event constraint. If the user input and record do not match-up then the `cursor.continue()` is called, which iterates to the next cursor record in the database.  Once the end of the cursor is reached and no event is found within the database we are free to insert the unique event into the database.

<script src="https://gist.github.com/76c5846bd2113970d89d.js"></script>

Opening a transaction to the `Events` object store and marking the mode as `readwrite` we are ready to call the `add()` object store method on the user event.  Upon `onsuccess` we are done inserting the event into the database and now await the user to invite guests.  

###**Adding and deleting Guests**
Before we add a guest into the database we must first check that the event and time that the guest is invited to exists.  Then we check that the guest's email is unique and that the guest is not already added to the event.  

<script src="https://gist.github.com/3b74c0699e9de57f5848.js"></script>

Because the user has to select the event at the right time retrieving the event is similar to the above event   

<br>
<br>
<br>
<br>
<br>
<br>
<br>

Since we are first checking to make sure that the event added is unique we are only The IndexedDB API has a [key range](https://developer.mozilla.org/en-US/docs/IndexedDB/IDBKeyRange) that designates an interval to which to query over .  We use the 'lowerbound(0)' that states all data values greater than or equal to 0.  To pull the data 'openCursor' on the object store over the key range.  This returns an 'IDBRequest' result object that contains the records satisfied by the key range.

Once we have our transaction and object store referenced for access we provide a key range interval and open a cursor over that interval.

An 'onsuccess' and an 'onerror' handler are always specified when an 'IDBRequest' object is returned.  On a successful request we assign the cursor the results, check that a cursor is returned and proceed to add the cursor values to the DOM.  While we're at it we open a transaction on the guest object store to read the guests that belong to the event just queried.  Here we do the query a little different from the events.

Let's take a step back and look at our schema.  The 'EID' key to the events is a data value for the guest object store, which identifies the guest belonging to an event.  When we query for the guest we want all the guests that belong to the event 'EID'.  Using the method 'index' on the object store opens the named index.  The 'openCursor' is called and populated with those guests that satisfy the 'EID' query.

The cursor is set to iterates over multiple records.  By using 'cursor.continue()' after utilizing the value of the cursor we iterate over all the records the cursor references. Again, an 'onsuccess' and 'onerror' handler are specified.

After populating the DOM with the stored data in IndexedDB we are ready for the user to interact with the application.
