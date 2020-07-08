export function setProps(dom,oldProps,newProps){
  for(let key in newProps){
    if(key !== 'children'){
      setProp(dom,key,newProps[key])
    }
  }
}

function setProp(dom,key,value){
   // claaName ==> class
  if(key === 'className') {
    key = 'class'
  }
  if(/on\w+/.test(key)){
    key = key.toLowerCase()
    dom[key] = value || ''
  }else if(key==='style'){
    if(!value || typeof value === 'string'){
      dom.style.cssText = value || ''
    }else if(value && typeof value === 'object') {
      for(let k in value) {
        if(typeof value[k] === 'number'){
          dom.style[k]=value[k] + 'px'
        }else{
          dom.style[k]=value[k]
        }
      }
    }
  }else{
    if(key in dom){
      dom[key] = value || ''
    }
  }
  // if(value){
  //   dom.setAttribute(key,value)
  // }else{
  //   dom.removeAttribute(key)
  // }
}