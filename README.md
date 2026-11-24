# Assignment 9 – Reading List (Express 5 REST API + React)

- **server/**: REST API with Node.js and **Express 5** (ES modules). Data lives in memory.
- **client/**: **React** app built with **Vite**. All requests go through `src/api/books.js`.

No database and no login: when the server restarts, the data returns to the seed.

## 1. Install and run

Requirements: Node.js (current LTS).

**Server (port 3000)**

```bash
cd server
npm install
npm run dev      # node --watch server.js   (or: npm start)
```

| Variable | Default | Meaning |
| --- | --- | --- |
| `PORT` | `3000` | Port of the API |
| `CLIENT_ORIGIN` | `http://localhost:5173` | The only origin allowed by CORS |

**Client (port 5173)**

```bash
cd client
cp .env.example .env     # VITE_API_URL=http://localhost:3000
npm install
npm run dev
```

There is **no Vite proxy**: the browser calls the API on another origin and the server allows it with the `cors` package.

## 2. File organization

```
assignment9/
 ├─ server/
 │   ├─ server.js       middleware, routes, 404 fallback, error middleware
 │   ├─ booksStore.js   in-memory data, async functions, immutable updates, query, stats
 │   ├─ validate.js     hand-written validation (id, book, PATCH fields, query string)
 │   └─ package.json / package-lock.json
 ├─ client/
 │   ├─ src/api/books.js          all fetch calls + shared request() helper
 │   ├─ src/components/           Filters, BookList, BookItem, BookForm, StatsPanel
 │   ├─ src/App.jsx               state, effects with AbortController, handlers
 │   ├─ src/main.jsx, index.css
 │   ├─ .env.example, index.html, vite.config.js (no proxy), package.json
 ├─ curl-evidence.sh              runs all the Section 7 requests
 ├─ .gitignore                    node_modules, .env, dist
 └─ README.md
```

**About `GET /api/crash`:** kept on purpose. It throws inside an `async` handler to prove that Express 5 forwards the error to the error middleware, which logs it and answers `500 { "error": "Something went wrong" }` without a stack trace.

## 3. Preflight request (Network tab)

Toggling **Read** sends `PATCH /api/books/:id` with `Content-Type: application/json`. This is not a simple request, so the browser first sends an **`OPTIONS`** preflight:

- **Request:** `Origin: http://localhost:5173`, `Access-Control-Request-Method: PATCH`, `Access-Control-Request-Headers: content-type`
- **Response:** `204 No Content`, `Access-Control-Allow-Origin: http://localhost:5173`, `Access-Control-Allow-Methods: GET,HEAD,PUT,PATCH,POST,DELETE`, `Access-Control-Allow-Headers: content-type`

Then the browser sends the real `PATCH`. A plain `GET` has no preflight, because the API module adds `Content-Type` only when there is a body.

## 4. Reasoning questions

**1. Parameters.** The `id` identifies *which* resource we want, so it is part of the path: `/api/books/3` is the address of one book. `genre` and `sort` do not name a resource; they only change *how* the collection is shown, so they are optional query parameters. If `id` were in the query string (`/api/books?id=3`), the URL would mean "the list filtered by id": a missing book would naturally be an empty list instead of a `404`, and `PUT`/`DELETE` and the `Location` header would not point to a clean resource address.

**2. Body parsing (experiment).** When `app.use(express.json())` was moved below the routes, the body was not parsed before the handler ran, so `req.body` was `undefined`. `POST /api/books` answered **`400`** with `{"error":"Request body must be a JSON object"}`, because `validateBook` checks the body first. Middleware runs in the order it is registered, so the parser must come before the routes.

**3. One response (experiment).** After removing the `return` before the `404` in `GET /api/books/:id` and requesting `/api/books/9999`, the client still received the `404`, but the handler continued and called `res.status(200).json(null)`. The server logged `Cannot set headers after they are sent to the client`. Sending a response does not stop the function; only `return` does, and one request can have only one response.

**4. PUT and PATCH.** `PATCH` is better for the **Read** checkbox or the star rating: the client sends only `{ "read": true }` or `{ "rating": 4 }` and does not need the other fields. `PUT` is better in the **Edit** form, where the user submits the whole book: the complete body replaces the stored book, and fields not sent go back to their defaults.

**5. CORS (experiment).** With a wrong `CLIENT_ORIGIN`, the browser console showed: *"Access to fetch at 'http://localhost:3000/api/books' from origin 'http://localhost:5173' has been blocked by CORS policy: The 'Access-Control-Allow-Origin' header has a value ... that is not equal to the supplied origin."* The server **did log** the `GET` request and ran it: CORS does not stop the request, the browser just refuses to give the response to JavaScript. `curl` still works because CORS is enforced only by browsers, to protect users from other websites.

**6. Validation.** Client checks only improve the user experience. Anyone can call the API without our form (curl, Postman, DevTools), and some rules, like the **duplicate** check, depend on data that only the server has. The server is the only place that protects the data, so it must validate everything.

**7. State (experiment).** After restarting the server, all added, edited or deleted books were gone and the list was back to the 7 seed books. The data lives only in a variable in the server process's **memory**, so it disappears when the process stops. To keep it, it must be saved outside the process, in a file or a **database**.

## 5. Self-study notes

- **`URLSearchParams`**: `toQueryString()` in `api/books.js` uses `search.set(key, value)` and `toString()`, which **encodes** special characters, so text like `a & b` cannot break the query or add a fake parameter.
- **`localeCompare`**: `a.localeCompare(b, 'en', { sensitivity: 'base' })` returns a negative, zero or positive number, exactly what a sort comparator needs; it sorts alphabetically and ignores case. Sorting uses **`toSorted()`**, which returns a new array, so the stored array is never reordered.
- **`import.meta.env` in Vite**: Vite replaces `import.meta.env.VITE_API_URL` at build time. Only variables starting with **`VITE_`** reach the browser, so secrets in the same `.env` are not shipped by mistake.
- **Empty `204` in Express 5**: `res.status(204).end()` sends the status with no body. The client's `request()` returns `null` for `204` instead of calling `response.json()`.
- **Cancelling `fetch`**: the list effect passes `controller.signal` to `fetch` and calls `controller.abort()` in the cleanup. The cancelled request rejects with an error whose `name` is **`'AbortError'`**; it is ignored, so an old response never overwrites a newer list.
- **Malformed JSON**: `express.json()` passes an error with `type === 'entity.parse.failed'` to the error middleware, which answers a JSON `400` instead of Express's HTML page.
- **Repeated query parameters**: Express parses `?genre=a&genre=b` as an **array**, which `parseListQuery` rejects with `400`.

## 6. Challenges

- **PATCH and the rating rule:** `{ read: false }` on a rated book makes the merged book invalid (`400`), so the client sends `{ read: false, rating: null }` when un-marking a book.
- **Stale responses:** fast typing in the search box made older responses arrive after newer ones; the `AbortController` cleanup with a short delay fixed it.
- **Route placement:** I once pasted a route inside another handler, which caused `Cannot POST /api/books`; every route must start after the previous route's `});`.
- **Immutability:** the stored array and books are frozen with `Object.freeze`, so any accidental in-place change throws an error.

## 7. Testing evidence (`curl --include`)

Generated with `bash curl-evidence.sh` on a freshly started server.### 200 - list with two query parameters
```
$ curl --include http://localhost:3000/api/books?genre=fantasy&sort=year&order=desc
HTTP/1.1 200 OK
X-Powered-By: Express
Access-Control-Allow-Origin: http://localhost:5173
Vary: Origin
X-Total-Count: 2
Content-Type: application/json; charset=utf-8
Content-Length: 234
ETag: W/"ea-bP8U79kbv5lv63kGBr1rOCieHBM"
Date: Tue, 24 Nov 2026 20:16:41 GMT
Connection: keep-alive
Keep-Alive: timeout=5

[{"id":5,"title":"A Game of Thrones","author":"George R.R. Martin","year":1996,"genre":"fantasy","read":false,"rating":null},{"id":2,"title":"The Hobbit","author":"J.R.R. Tolkien","year":1937,"genre":"fantasy","read":true,"rating":4}]
```

### 200 - one book
```
$ curl --include http://localhost:3000/api/books/2
HTTP/1.1 200 OK
X-Powered-By: Express
Access-Control-Allow-Origin: http://localhost:5173
Vary: Origin
Content-Type: application/json; charset=utf-8
Content-Length: 108
ETag: W/"6c-Njgao7QYoRqPB4F+UzLFWSwohrQ"
Date: Tue, 24 Nov 2026 20:16:41 GMT
Connection: keep-alive
Keep-Alive: timeout=5

{"id":2,"title":"The Hobbit","author":"J.R.R. Tolkien","year":1937,"genre":"fantasy","read":true,"rating":4}
```

### Stats BEFORE a change
```
$ curl --include http://localhost:3000/api/stats
HTTP/1.1 200 OK
X-Powered-By: Express
Access-Control-Allow-Origin: http://localhost:5173
Vary: Origin
Content-Type: application/json; charset=utf-8
Content-Length: 127
ETag: W/"7f-8zWTdf5feT9Y/2LkocGHEo6qpHA"
Date: Tue, 24 Nov 2026 20:16:41 GMT
Connection: keep-alive
Keep-Alive: timeout=5

{"total":7,"read":4,"unread":3,"averageRating":4.3,"byGenre":{"fiction":2,"fantasy":2,"science":1,"history":1,"non-fiction":1}}
```

### 201 - create (Location header; body id ignored)
```
$ curl --include -X POST http://localhost:3000/api/books -H Content-Type: application/json -d {"id":999,"title":"Neuromancer","author":"William Gibson","year":1984,"genre":"fiction"}
HTTP/1.1 201 Created
X-Powered-By: Express
Access-Control-Allow-Origin: http://localhost:5173
Vary: Origin
Location: /api/books/8
Content-Type: application/json; charset=utf-8
Content-Length: 113
ETag: W/"71-9NhG42qoSiEnBWeB0BGxRI6qv4U"
Date: Tue, 24 Nov 2026 20:16:41 GMT
Connection: keep-alive
Keep-Alive: timeout=5

{"id":8,"title":"Neuromancer","author":"William Gibson","year":1984,"genre":"fiction","read":false,"rating":null}
```

### Stats AFTER the change
```
$ curl --include http://localhost:3000/api/stats
HTTP/1.1 200 OK
X-Powered-By: Express
Access-Control-Allow-Origin: http://localhost:5173
Vary: Origin
Content-Type: application/json; charset=utf-8
Content-Length: 127
ETag: W/"7f-drajYDwCoAywPGm55LsgsMwWtKQ"
Date: Tue, 24 Nov 2026 20:16:41 GMT
Connection: keep-alive
Keep-Alive: timeout=5

{"total":8,"read":4,"unread":4,"averageRating":4.3,"byGenre":{"fiction":3,"fantasy":2,"science":1,"history":1,"non-fiction":1}}
```

### 400 - invalid body (year)
```
$ curl --include -X POST http://localhost:3000/api/books -H Content-Type: application/json -d {"title":"Future","author":"Someone","year":3000,"genre":"fiction"}
HTTP/1.1 400 Bad Request
X-Powered-By: Express
Access-Control-Allow-Origin: http://localhost:5173
Vary: Origin
Content-Type: application/json; charset=utf-8
Content-Length: 57
ETag: W/"39-2hxkQVGUygT77eAZY8u2BQSh9Ts"
Date: Tue, 24 Nov 2026 20:16:41 GMT
Connection: keep-alive
Keep-Alive: timeout=5

{"error":"year must be an integer between 1000 and 2026"}
```

### 400 - malformed JSON
```
$ curl --include -X POST http://localhost:3000/api/books -H Content-Type: application/json -d {"title": 
HTTP/1.1 400 Bad Request
X-Powered-By: Express
Access-Control-Allow-Origin: http://localhost:5173
Vary: Origin
Content-Type: application/json; charset=utf-8
Content-Length: 72
ETag: W/"48-VI1VUyFFXgQMMn+TIZ5fc4w82qk"
Date: Tue, 24 Nov 2026 20:16:41 GMT
Connection: keep-alive
Keep-Alive: timeout=5

{"error":"Malformed JSON in request body: Unexpected end of JSON input"}
```

### 400 - repeated query parameter
```
$ curl --include http://localhost:3000/api/books?genre=fiction&genre=history
HTTP/1.1 400 Bad Request
X-Powered-By: Express
Access-Control-Allow-Origin: http://localhost:5173
Vary: Origin
Content-Type: application/json; charset=utf-8
Content-Length: 58
ETag: W/"3a-6mT0mDMdSpAfOdjXJoHaV9ooo4w"
Date: Tue, 24 Nov 2026 20:16:41 GMT
Connection: keep-alive
Keep-Alive: timeout=5

{"error":"Query parameter \"genre\" must not be repeated"}
```

### 400 - invalid id
```
$ curl --include http://localhost:3000/api/books/abc
HTTP/1.1 400 Bad Request
X-Powered-By: Express
Access-Control-Allow-Origin: http://localhost:5173
Vary: Origin
Content-Type: application/json; charset=utf-8
Content-Length: 59
ETag: W/"3b-JJZZfay099yRX7VYq+HV9gvhf1M"
Date: Tue, 24 Nov 2026 20:16:41 GMT
Connection: keep-alive
Keep-Alive: timeout=5

{"error":"id must be a positive integer, received \"abc\""}
```

### 404 - missing book
```
$ curl --include http://localhost:3000/api/books/9999
HTTP/1.1 404 Not Found
X-Powered-By: Express
Access-Control-Allow-Origin: http://localhost:5173
Vary: Origin
Content-Type: application/json; charset=utf-8
Content-Length: 39
ETag: W/"27-qMkemj7HT6DzWGHQqTCbCd5l7Fs"
Date: Tue, 24 Nov 2026 20:16:42 GMT
Connection: keep-alive
Keep-Alive: timeout=5

{"error":"Book with id 9999 not found"}
```

### 409 - duplicate
```
$ curl --include -X POST http://localhost:3000/api/books -H Content-Type: application/json -d {"title":"dune","author":"FRANK HERBERT","year":1965,"genre":"fiction"}
HTTP/1.1 409 Conflict
X-Powered-By: Express
Access-Control-Allow-Origin: http://localhost:5173
Vary: Origin
Content-Type: application/json; charset=utf-8
Content-Length: 66
ETag: W/"42-CtlzQchPM6HgIAjlvAg18KUhoBA"
Date: Tue, 24 Nov 2026 20:16:42 GMT
Connection: keep-alive
Keep-Alive: timeout=5

{"error":"A book titled \"dune\" by FRANK HERBERT already exists"}
```

### PATCH book 8 - only sent fields change, unknown field ignored
```
$ curl --include -X PATCH http://localhost:3000/api/books/8 -H Content-Type: application/json -d {"read":true,"rating":5,"color":"blue"}
HTTP/1.1 200 OK
X-Powered-By: Express
Access-Control-Allow-Origin: http://localhost:5173
Vary: Origin
Content-Type: application/json; charset=utf-8
Content-Length: 109
ETag: W/"6d-zr8F2Qwd7mbkjZXi2s38A06xBdc"
Date: Tue, 24 Nov 2026 20:16:42 GMT
Connection: keep-alive
Keep-Alive: timeout=5

{"id":8,"title":"Neuromancer","author":"William Gibson","year":1984,"genre":"fiction","read":true,"rating":5}
```

### PUT book 8 - complete body, read/rating reset to defaults
```
$ curl --include -X PUT http://localhost:3000/api/books/8 -H Content-Type: application/json -d {"title":"Neuromancer","author":"William Gibson","year":1984,"genre":"science"}
HTTP/1.1 200 OK
X-Powered-By: Express
Access-Control-Allow-Origin: http://localhost:5173
Vary: Origin
Content-Type: application/json; charset=utf-8
Content-Length: 113
ETag: W/"71-w5jgcbf31srhnxo5TIoiUD2zVLs"
Date: Tue, 24 Nov 2026 20:16:42 GMT
Connection: keep-alive
Keep-Alive: timeout=5

{"id":8,"title":"Neuromancer","author":"William Gibson","year":1984,"genre":"science","read":false,"rating":null}
```

### 204 - delete
```
$ curl --include -X DELETE http://localhost:3000/api/books/8
HTTP/1.1 204 No Content
X-Powered-By: Express
Access-Control-Allow-Origin: http://localhost:5173
Vary: Origin
Date: Tue, 24 Nov 2026 20:16:42 GMT
Connection: keep-alive
Keep-Alive: timeout=5


```

### 404 - same delete repeated
```
$ curl --include -X DELETE http://localhost:3000/api/books/8
HTTP/1.1 404 Not Found
X-Powered-By: Express
Access-Control-Allow-Origin: http://localhost:5173
Vary: Origin
Content-Type: application/json; charset=utf-8
Content-Length: 36
ETag: W/"24-h0UF16CcN9f8dKhBtZhZzRBAmEA"
Date: Tue, 24 Nov 2026 20:16:42 GMT
Connection: keep-alive
Keep-Alive: timeout=5

{"error":"Book with id 8 not found"}
```

### 404 - unknown /api route
```
$ curl --include http://localhost:3000/api/authors
HTTP/1.1 404 Not Found
X-Powered-By: Express
Access-Control-Allow-Origin: http://localhost:5173
Vary: Origin
Content-Type: application/json; charset=utf-8
Content-Length: 21
ETag: W/"15-bm7tJgu8FHlq5QU+Y6gDxOGPfRc"
Date: Tue, 24 Nov 2026 20:16:42 GMT
Connection: keep-alive
Keep-Alive: timeout=5

{"error":"Not found"}
```

### 500 - deliberate crash
```
$ curl --include http://localhost:3000/api/crash
HTTP/1.1 500 Internal Server Error
X-Powered-By: Express
Access-Control-Allow-Origin: http://localhost:5173
Vary: Origin
Content-Type: application/json; charset=utf-8
Content-Length: 32
ETag: W/"20-cI8B1wZuBEyTE5ClDvphKZx7wd0"
Date: Tue, 24 Nov 2026 20:16:42 GMT
Connection: keep-alive
Keep-Alive: timeout=5

{"error":"Something went wrong"}
```

### OPTIONS preflight imitation
```
$ curl --include -X OPTIONS http://localhost:3000/api/books/1 -H Origin: http://localhost:5173 -H Access-Control-Request-Method: PATCH -H Access-Control-Request-Headers: content-type
HTTP/1.1 204 No Content
X-Powered-By: Express
Access-Control-Allow-Origin: http://localhost:5173
Vary: Origin, Access-Control-Request-Headers
Access-Control-Allow-Methods: GET,HEAD,PUT,PATCH,POST,DELETE
Access-Control-Allow-Headers: content-type
Content-Length: 0
Date: Tue, 24 Nov 2026 20:16:42 GMT
Connection: keep-alive
Keep-Alive: timeout=5


```

