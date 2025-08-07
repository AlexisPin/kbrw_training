var createReactClass = require('create-react-class')
var remoteProps = require('../props.js')
var React = require("react")

const Order = createReactClass({
  statics: {
    remoteProps: [remoteProps.order]
  },
  render() {
    const order = this.props.order.value
    return <JSXZ in="details" sel=".container">
      <Z sel=".order-details">
        <JSXZ in="details" sel=".customer-details-label" />
        <JSXZ in="details" sel=".customer-details-value">
          <Z sel=".client-details-value">{order.custom?.customer?.full_name}</Z>
          <Z sel=".address-details-value">{order.custom?.billing_address?.street[0]} {order.custom?.billing_address?.postcode} {order.custom?.billing_address?.city}</Z>
          <Z sel=".command-number-value">{order.remoteid}</Z>
        </JSXZ>
      </Z>

      <Z sel=".tab-details-body">
        {order.custom.items.map(item => (
          <JSXZ in="details" sel=".tab-details-line" key={item.item_id}>
            <Z sel=".col-1">{item.product_title}</Z>
            <Z sel=".col-2">{item.quantity_to_fetch}</Z>
            <Z sel=".col-3">{item.unit_price}</Z>
            <Z sel=".col-4">{item.unit_price * item.quantity_to_fetch}</Z>
          </JSXZ>)
        )}
      </Z>
      <Z sel=".b-button" onClick={() => goTo("orders", null, null)}>
        <ChildrenZ />
      </Z>
    </JSXZ>
  }
})

module.exports = Order;