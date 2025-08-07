var Qs = require('qs')

const remoteProps = {
  orders: (props) => {
    var qs = { ...props.qs }
    var query = Qs.stringify(qs)
    return {
      url: "/api/orders" + (query == '' ? '' : '?' + query),
      prop: "orders"
    }
  },
  order: (props) => {
    return {
      url: "/api/order/" + props.order_id,
      prop: "order"
    }
  }
}


module.exports = remoteProps