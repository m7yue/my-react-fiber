
import {TAG_ROOT} from './constants'
import {scheduleRoot} from './scheduler'


function render(el,container){
  let rootFiber={
    tag: TAG_ROOT,
    stateNode: container,
    props:{children:[el]}
  }
  scheduleRoot(rootFiber)
}

const ReactDOM={
  render
}

export default ReactDOM