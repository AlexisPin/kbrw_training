const Layout = require("./component/layout.js")
const Header = require("./component/header.js")
const Orders = require("./component/orders.js")
const Order = require("./component/order.js")

const routes = {
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
      const r = new RegExp("/order/([^/]*)$").exec(path)
      return r && { handlerPath: [Layout, Header, Order], order_id: r[1] }
    }
  }
}


module.exports = routes;