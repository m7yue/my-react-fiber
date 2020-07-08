import {Update} from './UpdateQueue'
import { scheduleRoot,useReducer,useState } from './scheduler'
const { ELEMENT_TEXT } = require("./constants")

function createElement(type, config, ...children) {
  delete config._self
  delete config._source
  return {
    type,
    props:{
      ...config,
      children:children.map(child=>{
        return typeof child==='object'?child:{
          type:ELEMENT_TEXT,
          props:{text:child,children:[]}
        }
      })
    }
  }
}

class Component{
  constructor(props){
    this.props=props
  }
  setState(payload){// 可能是对象，也可能是一个函数
    let update=new Update(payload)
    // updateQueue 其实是放在此类组件对应fiber节点的
    this.internalFiber.updateQueue.enqueueUpdate(update)
    scheduleRoot() // 从根节点开始调度 
  }
}

Component.prototype.isReactComponent={} // 类组件

const React={
  createElement,
  Component,
  useReducer,
  useState
}

export default React