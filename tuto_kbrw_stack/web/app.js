require('!!file-loader?name=[name].[ext]!./index.html')
/* required library for our React app */
var ReactDOM = require('react-dom')
var React = require("react")
var createReactClass = require('create-react-class')

/* required css for our application */
require('./webflow/css/tuto.webflow.css');

var orders = [
  { remoteid: "000000189", custom: { customer: { full_name: "TOTO & CIE" }, billing_address: "Some where in the world" }, items: 2 },
  { remoteid: "000000190", custom: { customer: { full_name: "Looney Toons" }, billing_address: "The Warner Bros Company" }, items: 3 },
  { remoteid: "000000191", custom: { customer: { full_name: "Asterix & Obelix" }, billing_address: "Armorique" }, items: 29 },
  { remoteid: "000000192", custom: { customer: { full_name: "Lucky Luke" }, billing_address: "A Cowboy doesn't have an address. Sorry" }, items: 0 },
]


var Page = createReactClass({
  render() {
    return <JSXZ in="orders" sel=".container">
      {orders.map(order => (
        <JSXZ in="orders" sel=".tab-orders-line">
          <Z sel=".col-1">{order.remoteid}</Z>
          <Z sel=".col-2">{order.custom.customer.full_name}</Z>
          <Z sel=".col-3">{order.custom.billing_address}</Z>
          <Z sel=".col-4">{order.items}</Z>
        </JSXZ>
      ))}
    </JSXZ>
  }
})

ReactDOM.render(<Page />, document.getElementById('root'));
