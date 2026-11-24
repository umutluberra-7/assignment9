#!/usr/bin/env bash
# Runs every request required by Section 7 and writes curl-evidence.txt
API="http://localhost:3000"
OUT="curl-evidence.txt"
: > "$OUT"
J='Content-Type: application/json'

run() {
  local title="$1"; shift
  { echo "### $title"; echo '```'; echo "\$ curl --include $*"; curl --silent --include "$@"; echo; echo '```'; echo; } >> "$OUT"
}

run "200 - list with two query parameters" "$API/api/books?genre=fantasy&sort=year&order=desc"
run "200 - one book" "$API/api/books/2"
run "Stats BEFORE a change" "$API/api/stats"
run "201 - create (Location header; body id ignored)" -X POST "$API/api/books" -H "$J" -d '{"id":999,"title":"Neuromancer","author":"William Gibson","year":1984,"genre":"fiction"}'
run "Stats AFTER the change" "$API/api/stats"
run "400 - invalid body (year)" -X POST "$API/api/books" -H "$J" -d '{"title":"Future","author":"Someone","year":3000,"genre":"fiction"}'
run "400 - malformed JSON" -X POST "$API/api/books" -H "$J" -d '{"title": '
run "400 - repeated query parameter" "$API/api/books?genre=fiction&genre=history"
run "400 - invalid id" "$API/api/books/abc"
run "404 - missing book" "$API/api/books/9999"
run "409 - duplicate" -X POST "$API/api/books" -H "$J" -d '{"title":"dune","author":"FRANK HERBERT","year":1965,"genre":"fiction"}'
run "PATCH book 8 - only sent fields change, unknown field ignored" -X PATCH "$API/api/books/8" -H "$J" -d '{"read":true,"rating":5,"color":"blue"}'
run "PUT book 8 - complete body, read/rating reset to defaults" -X PUT "$API/api/books/8" -H "$J" -d '{"title":"Neuromancer","author":"William Gibson","year":1984,"genre":"science"}'
run "204 - delete" -X DELETE "$API/api/books/8"
run "404 - same delete repeated" -X DELETE "$API/api/books/8"
run "404 - unknown /api route" "$API/api/authors"
run "500 - deliberate crash" "$API/api/crash"
run "OPTIONS preflight imitation" -X OPTIONS "$API/api/books/1" -H "Origin: http://localhost:5173" -H "Access-Control-Request-Method: PATCH" -H "Access-Control-Request-Headers: content-type"
echo "Wrote $OUT"