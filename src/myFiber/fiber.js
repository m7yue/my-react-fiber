// let rootFiber=require('./element.js')


let A1={type:'div',key:'A1'}
let B1={type:'div',key:'B1',return:A1}
let B2={type:'div',key:'B2',return:A1}
let C1={type:'div',key:'C1',return:B1}
let C2={type:'div',key:'C2',return:B1}

A1.child=B1
B1.sibling=B2
B1.child=C1
C1.sibling=C2

rootFiber=A1

let nextUnitOfWork=null
let startTime=Date.now()
function workLoop(deadline){
  while(nextUnitOfWork&&(deadline.timeRemaining()>1||deadline.didTimeout)){
    nextUnitOfWork=performUnitOfWork(nextUnitOfWork)
  }

  if(!nextUnitOfWork){
    console.log('render阶段结束了')
    console.log(Date.now()-startTime)
  }else{
    requestIdleCallback(workLoop,{timeout:1000})
  }
}

function performUnitOfWork(fiber){
  beinWork(fiber)

  if(fiber.child){
    return fiber.child
  }
  while(fiber){
    completeUnitOfWork(fiber)
    if(fiber.sibling){
      return fiber.sibling
    }
    fiber=fiber.return
  }
}

function completeUnitOfWork(fiber){
  console.log('结束',fiber.key)
}

function beinWork(fiber){
  sleep(20)
  console.log('开始',fiber.key)
}

nextUnitOfWork=rootFiber
requestIdleCallback(workLoop,{timeout:1000})



function sleep(delay){
  for(var start=Date.now();Date.now()-start<=delay;){}
}