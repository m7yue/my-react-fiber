import { TAG_ROOT, ELEMENT_TEXT, TAG_TEXT, TAG_HOST, PLACEMENT, DELETION, UPDATE, TAG_CLASS, TAG_FUNCTION_COMPONENT } from "./constants"
import { setProps } from "./utils"
import { UpdateQueue, Update } from "./UpdateQueue"

let nextUnitOfWork=null // 下一个工作单元
let workInProgressRoot=null
let currentRoot=null
let deletions=[] // 删除的节点我们并不放在effectList里，所以要单独记录并执行

let workInProgressFiber = null // 正在工作中的Fiber
let hookIndex = 0 // hooks索引


export function scheduleRoot(rootFiber){ // 双缓冲机制  概率性优化 假设每次的fiber差不多
  if(currentRoot&&currentRoot.alternate){
    workInProgressRoot=currentRoot.alternate // 拿到上上次的树准备复用
    workInProgressRoot.alternate=currentRoot
    if(rootFiber) workInProgressRoot.props=rootFiber.props
  }else if(currentRoot){// 说明至少已经渲染过一次了
    if(rootFiber){ // 执行 setState 时， rootFiber 没有值
      rootFiber.alternate=currentRoot
      workInProgressRoot=rootFiber
    }else{
      workInProgressRoot={ // 创建一个根 Fiber
        ...currentRoot,
        alternate:currentRoot
      }
    }
  }else{
   workInProgressRoot=rootFiber
  }
  workInProgressRoot.firstEffect=workInProgressRoot.lastEffect=workInProgressRoot.nextEffect=null // 清空链表指针 防止出问题
  nextUnitOfWork=workInProgressRoot

  requestIdleCallback(workLoop,{timeout:500})
}

function workLoop(deadline){
  let shouldYield=false //  是否让出时间片或者控制权
  while(nextUnitOfWork&&!shouldYield){
    nextUnitOfWork=performUnitOfWork(nextUnitOfWork) // 执行一个任务
    shouldYield=deadline.timeRemaining()<1

    requestIdleCallback(workLoop,{timeout:500})
  }

  if(!nextUnitOfWork && workInProgressRoot){
    commitRoot()
    console.log('render 结束了')
  }
}

/**
 * cimmit 阶段 更新DOM
 */
function commitRoot(){
  deletions.forEach(commitWork)// 执行 effectList 之前先把该删除的元素删掉

  let currentFiber=workInProgressRoot.firstEffect
  while (currentFiber) {
      commitWork(currentFiber)
      currentFiber=currentFiber.nextEffect
  }
  deletions.length=0 // 提交之后清空deletions数组
  currentRoot=workInProgressRoot // 存储渲染成功的根 fiber
  workInProgressRoot=null
}

/**
 * 更具补丁类型做相应的处理
 * @param {}} currentFiber 
 */
function commitWork(currentFiber){
  if(!currentFiber) return
  let returnFiber=currentFiber.return
  while(returnFiber.tag!==TAG_HOST&&returnFiber.tag!==TAG_TEXT&&returnFiber.tag!==TAG_ROOT){
    returnFiber=returnFiber.return
  }

  let returnDOM=returnFiber.stateNode
  if(returnDOM&&currentFiber.effectTag===PLACEMENT){ // 新增节点
    let nextFiber=currentFiber
    // 如果要挂载的节点不是DOM节点，比如说是类组件Fiber,一直找第一个儿子，直到找到一个真实DOM节点
    while(nextFiber.tag!==TAG_HOST&&nextFiber.tag!==TAG_TEXT){
      nextFiber=currentFiber.child 
    }
    returnDOM.appendChild(nextFiber.stateNode)
  }else if(currentFiber.effectTag===DELETION){
    return commitDeletion(currentFiber,returnDOM)
    // returnDOM.removeChild(currentFiber.stateNode)
  }else if(currentFiber.effectTag===UPDATE){
    if(currentFiber.type===ELEMENT_TEXT){
      if(currentFiber.alternate.props.text!==currentFiber.props.text){
        currentFiber.stateNode.textContent=currentFiber.props.text 
      }
    }else{
      updateDOM(currentFiber.stateNode,currentFiber.alternate.props,currentFiber.props)
    }
  }
  currentFiber.effectTag=null
}

function commitDeletion(currentFiber,returnDOM){
  if(currentFiber.tag===TAG_HOST||currentFiber.tag===TAG_TEXT){
    returnDOM.removeChild(currentFiber.stateNode)
  }else{
    commitDeletion(currentFiber.child,returnDOM)
  }
}
/**
 * 1. beginWork 预处理当前 Fiber 所有儿子节点，然后返回下一个工作单元
 * 2. completeUnitOfWork 按后根序处理当前 Fiber 树，开始创建副作用链表 effectList
 * @param {*} currentFiber 
 */
function performUnitOfWork(currentFiber){
  beinWork(currentFiber)
  if(currentFiber.child){
    return currentFiber.child
  }
  while(currentFiber) {
    completeUnitOfWork(currentFiber)
    if(currentFiber.sibling){
      return currentFiber.sibling
    }
    currentFiber=currentFiber.return
  }
}

/**
 * 1.收集有副作用的 Fiber 根据 Fiber 的指针关系
 * 2.每一个fiber有两个属性 firstEfftect 指向第一个有副作用的fiber,lastEffect 指向最后一个，中间的用 nextEffect 做成一个单链表
 * @param {*} currentFiber 
 */
function completeUnitOfWork(currentFiber){
  let returnFiber=currentFiber.return
  if(returnFiber){
    const effectTag=currentFiber.effectTag
    if(effectTag){
      if(!returnFiber.lastEffect){
        if(currentFiber.lastEffect) {
          currentFiber.lastEffect.nextEffect = currentFiber
          currentFiber.lastEffect=currentFiber
        }
        returnFiber.firstEffect=currentFiber.firstEffect||currentFiber
        returnFiber.lastEffect=currentFiber.lastEffect||currentFiber
      }else{
        if(currentFiber.tag===TAG_TEXT){
          returnFiber.lastEffect.nextEffect=currentFiber
          returnFiber.lastEffect=currentFiber
        }else{
          if(currentFiber.lastEffect) {
            currentFiber.lastEffect.nextEffect = currentFiber
            currentFiber.lastEffect=currentFiber
          }
          returnFiber.lastEffect.nextEffect=currentFiber.firstEffect
          returnFiber.lastEffect=currentFiber.lastEffect
        }  
      }
    }
  }
} 

/**
 * 1.创建真实的 DOM 元素
 * 2.预处理/创建子fiber
 * @param {*} currentFiber 
 */
function beinWork(currentFiber){
    if(currentFiber.tag===TAG_ROOT){
      updateHostRoot(currentFiber)
    }else if(currentFiber.tag===TAG_TEXT){
      updateHostText(currentFiber)
    }else if(currentFiber.tag===TAG_HOST){
      updateHost(currentFiber)
    }else if(currentFiber.tag===TAG_CLASS){ // 类组件
      updateClassComponent(currentFiber)
    }else if(currentFiber.tag===TAG_FUNCTION_COMPONENT){ // 函数组件
      updateFunctionComponent(currentFiber)
    }
}

/**
 * 处理函数组件
 * @param {*} currentFiber 
 */
function updateFunctionComponent(currentFiber){
  workInProgressFiber=currentFiber
  hookIndex=0
  workInProgressFiber.hooks=[]

  const newChildren = [currentFiber.type(currentFiber.props)]
  reconcileChildren(currentFiber,newChildren)
}

/**
 * 处理类组件
 * @param {*} currentFiber 
 */
function updateClassComponent(currentFiber){
  if(!currentFiber.stateNode){ // 类组件的stateNode 是组件的实例 
    currentFiber.stateNode=new currentFiber.type(currentFiber.props)
    currentFiber.stateNode.internalFiber=currentFiber // internalFiber
    currentFiber.updateQueue=new UpdateQueue()
  }
  // 给组件的实例赋值
  currentFiber.stateNode.state=currentFiber.updateQueue.forceUpdate(currentFiber.stateNode.state)
  let newElement=currentFiber.stateNode.render() // render 返回虚拟DOM
  const newChildren=[newElement]
  reconcileChildren(currentFiber,newChildren)
}

/**
 * 处理非文本DOM
 * @param {*} currentFiber 
 */
function updateHost(currentFiber){
  if(!currentFiber.stateNode){
    currentFiber.stateNode = createDOM(currentFiber)
  }
  const newChildren=currentFiber.props.children
  reconcileChildren(currentFiber,newChildren )
}

/**
 * 处理文本
 * @param {*} currentFiber 
 */
function updateHostText(currentFiber){
  if(!currentFiber.stateNode){
    currentFiber.stateNode = createDOM(currentFiber)
  }
}

/**
 * 处理根节点
 * @param {*} currentFiber 
 */
function updateHostRoot(currentFiber){
  let newChildren=currentFiber.props.children
  reconcileChildren(currentFiber,newChildren)
}

/**
 * 1.遍历子虚拟DOM元素数组，为每个虚拟DOM元素创建子Fiber
 * 2.diff 处理
 * 3.构造兄弟指向关系 sibling
 * @param {*} currentFiber 
 * @param {*} newChildren 
 */
function reconcileChildren(currentFiber,newChildren){
  let newChildIndex=0
  let oldFiber=currentFiber.alternate&&currentFiber.alternate.child
  if(oldFiber) oldFiber.firstEffect=oldFiber.lastEffect=oldFiber.nextEffect=null
  let prevSibling
  // 遍历子虚拟DOM元素数组，为每个虚拟DOM元素创建子Fiber
  while (newChildIndex<newChildren.length||oldFiber) {
    let newChild=newChildren[newChildIndex] // 取出虚拟DOM节点
    let newFiber
    const sameType=oldFiber&&newChild&&oldFiber.type===newChild.type

    let tag
    if(newChild&&typeof newChild.type==='function'&&newChild.type.prototype.isReactComponent){
      tag=TAG_CLASS
    }else if(newChild&&newChild.type===ELEMENT_TEXT){
      tag=TAG_TEXT
    }else if(newChild&&typeof newChild.type==='string'){
      tag=TAG_HOST
    }else if(newChild&&typeof newChild.type==='function'){
      tag=TAG_FUNCTION_COMPONENT
    } 

    if(sameType){// 说明老fiber和新虚拟DOM类型一样，可以复用老的DOM节点，更新即可
      if(oldFiber.alternate){// 说明至少更新过一次了 作用于双缓冲优化
        newFiber=oldFiber.alternate
        newFiber.props=newChild.props
        newFiber.alternate=oldFiber
        newFiber.effectTag=UPDATE
        newFiber.updateQueue=oldFiber.updateQueue||new UpdateQueue()
        newFiber.nextEffect=null
      }else{
        newFiber={
          tag:oldFiber.tag,
          type:oldFiber.type,
          props:newChild.props,
          stateNode:oldFiber.stateNode, // 还没有创建DOM元素
          return:currentFiber,
          updateQueue:oldFiber.updateQueue||new UpdateQueue(),
          alternate:oldFiber, // 让新fiber的alternate指向老的fiber节点
          effectTag:UPDATE, // 副作用标识  在render阶段会收集副作用 更新 删除 增加   这个当前还没有进行diff比较
          nextEffect:null,
        }
      }
    }else{
      // beginWork 创建fiber 在completeUnitOfWork的时候收集effect
      if(newChild){
        newFiber={
          tag,
          type:newChild.type,
          props:newChild.props,
          stateNode:null, // 还没有创建DOM元素
          return:currentFiber,
          effectTag:PLACEMENT, // 副作用标识  在render阶段会收集副作用 更新 删除 增加   这个当前还没有进行diff比较
          updateQueue:new UpdateQueue(),
          nextEffect:null,
        }
      }
      if(oldFiber){
        oldFiber.effectTag=DELETION
        deletions.push(oldFiber)
      }
    }
    
    if(oldFiber){
      oldFiber=oldFiber.sibling // 如果老fiber有值，oldFiber指针向后移动
    }

    if(newFiber){
      if(newChildIndex===0){
        currentFiber.child=newFiber
      }else{
        prevSibling.sibling=newFiber
      }
      prevSibling=newFiber
    }
    newChildIndex++
  }
}

/**
 * 更新DOM
 * @param {*} stateNode 
 * @param {*} oldProps 
 * @param {*} newProps 
 */
function updateDOM(stateNode,oldProps,newProps){
  if(stateNode&&stateNode.setAttribute){
    setProps(stateNode,oldProps,newProps)
  }
}

/**
 * 创建DOM
 * @param {*} currentFiber 
 */
function createDOM(currentFiber){
  if(currentFiber.tag===TAG_TEXT){
    return document.createTextNode(currentFiber.props.text)
  }else if(currentFiber.tag===TAG_HOST){
    let stateNode=document.createElement(currentFiber.type)
    updateDOM(stateNode,{},currentFiber.props)
    return stateNode
  }
}

/**
 *  workInProgressFiber=currentFiber
 *  hookIndex=0
 *  workInProgressFiber.hooks=[]
 */
export function useReducer(reducer,initialValue){
  let oldHook = workInProgressFiber.alternate&&workInProgressFiber.alternate.hooks&&workInProgressFiber.alternate.hooks[hookIndex]
  let newHook=oldHook
  if(newHook){
    newHook.state=newHook.updateQueue.forceUpdate(newHook.state)
  }else{// 第一次渲染
    newHook={
      state:initialValue,
      updateQueue:new UpdateQueue()
    }
  }
  const dispatch=action=>{
    let payload=reducer?reducer(newHook.state,action):action
    newHook.updateQueue.enqueueUpdate(new Update(payload))
    
    scheduleRoot()
  }
  workInProgressFiber.hooks[hookIndex++]=newHook
  return [newHook.state,dispatch]
}

export function useState(initialValue){
  return useReducer(null,initialValue )
}