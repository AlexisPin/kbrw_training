let browserState = {}
function getBrowserState() {
  return browserState
}
function setBrowserState(state) {
  browserState = state
}

module.exports = {
  getBrowserState,
  setBrowserState
}
