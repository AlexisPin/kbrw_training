var Bert = require('@kbrw/node_erlastic/bert');
Bert.convention = Bert.ERLANG;
Bert.all_binaries_as_string = true;


require('@kbrw/node_erlastic').server(function (term, from, current_amount, done) {
  if (term == "hello") return done("reply", "Hello world!");
  if (term == "get") return done("reply", current_amount);
  if (term[0] == "add") return done("noreply", current_amount + term[1]);
  if (term[0] == "rem") return done("noreply", current_amount - term[1]);
  throw new Error("unexpected request")
});
