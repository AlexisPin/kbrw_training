require('!!file-loader?name=[name].[ext]!./index.html')
/* required library for our React app */
var ReactDOM = require('react-dom')
var React = require("react")
var createReactClass = require('create-react-class')
var Qs = require('qs')
var Cookie = require('cookie')

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
      {/* {orders.map(order => (
        <JSXZ in="orders" sel=".tab-orders-line">
          <Z sel=".col-1">{order.remoteid}</Z>
          <Z sel=".col-2">{order.custom.customer.full_name}</Z>
          <Z sel=".col-3">{order.custom.billing_address}</Z>
          <Z sel=".col-4">{order.items}</Z>
        </JSXZ>
      ))} */}
      <ChildrenZ />
    </JSXZ>
  }
})

var Child = createReactClass({
  render() {
    var [ChildHandler, ...rest] = this.props.handlerPath
    return <ChildHandler {...this.props} handlerPath={rest} />
  }
})

var browserState = { Child: Child }

var routes = {
  "orders": {
    path: (params) => {
      return "/";
    },
    match: (path, qs) => {
      return (path == "/") && { handlerPath: [Layout, Header, Orders] }
    }
  },
  "order": {
    path: (params) => {
      return "/order/" + params;
    },
    match: (path, qs) => {
      var r = new RegExp("/order/([^/]*)$").exec(path)
      return r && { handlerPath: [Layout, Header, Order], order_id: r[1] }
    }
  }
}

function onPathChange() {
  var path = location.pathname
  var qs = Qs.parse(location.search.slice(1))
  var cookies = Cookie.parse(document.cookie)

  browserState = {
    ...browserState,
    path: path,
    qs: qs,
    cookie: cookies
  }

  var route

  for (var key in routes) {
    routeProps = routes[key].match(path, qs)
    if (routeProps) {
      route = key
      break;
    }
  }

  browserState = {
    ...browserState,
    ...routeProps,
    route: route
  }

  // If the path in the URL doesn't match with any of our routes, we render an Error component (we will have to create it later)
  if (!route)
    return ReactDOM.render(<ErrorPage message={"Not Found"} code={404} />, document.getElementById('root'))

  // If we found a match, we render the Child component, which will render the handlerPath components recursively, remember ? ;)
  console.log(browserState)
  ReactDOM.render(<Child {...browserState} />, document.getElementById('root'))
}

var Layout = createReactClass({
  render() {
    return <JSXZ in="orders" sel=".layout">
      <Z sel=".layout-container">
        <this.props.Child {...this.props} />
      </Z>
    </JSXZ>
  }
})

var Header = createReactClass({
  render() {
    return <JSXZ in="orders" sel=".header">
      <Z sel=".header-container">
        <this.props.Child {...this.props} />
      </Z>
    </JSXZ>
  }
})

var Orders = createReactClass({
  render() {
    return <JSXZ in="orders" sel=".orders">
      <Z sel=".orders-container">

      </Z>
    </JSXZ>
  }
})

var Order = createReactClass({
  render() {
    return <JSXZ in="details" sel=".order">
      <Z sel=".order-container">

      </Z>
    </JSXZ>
  }
})

var ErrorPage = createReactClass({
  render() {
    return <div>
      <h1>Error {this.props.code}</h1>
      <p>{this.props.message}</p>
    </div>
  }
})

window.addEventListener('popstate', onPathChange);
onPathChange(); 
