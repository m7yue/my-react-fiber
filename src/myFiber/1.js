class Update{
  constructor(payload,nextUpdate){
    this.payload=payload
    this.nextUpdate=nextUpdate
  }
}

class UpdateQueue{
  constructor(){
    this.baseState=null
    this.firstUpdate=null
    this.lastUpdate=null
  }

  enqueueUpdate(update){
    if(this.firstUpdate==null){
      this.firstUpdate=this.lastUpdate=update
    }else{
      this.lastUpdate.nextUpdate=update
      this.lastUpdate=update
    }
  }

  forceUpdate(){
    let currentState=this.baseState||{}
    let currentUpdate=this.firstUpdate

    while(currentUpdate){
      let {payload,nextUpdate}=currentUpdate
      let nextState=typeof payload === 'function' ? currentUpdate.payload(currentState):payload
      currentState={...currentState,...nextState}
      
      currentUpdate=nextUpdate
    }
    
    this.firstUpdate=this.lastUpdate=null
    this.baseState=currentState
    return currentState
  }
}



let queue=new UpdateQueue()
