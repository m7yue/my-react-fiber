import React from './myFiber/src/react'
// import ReactDOM from './myFiber/src/react-dom';
// import React from './myFiber/src/react';
/* let style={border:'3px solid red',margin:'5px'}
let element=(
  <div id="A1" style={style}>
    A1
    <div id="B1" style={style}>
      B1
      <div id="C1" style={style}>
        C1
      </div>
      <div id="C2" style={style}>
        C2
      </div>
    </div>
    <div id="B2" style={style}>
      B2
    </div>
  </div>
)
console.log(element)
ReactDOM.render(element,document.getElementById('root')); */

/* let render2=document.getElementById('render2')
render2.addEventListener('click',()=>{
  let element2=(
    <div id="A1-new" style={style}>
      A1-new
      <div id="B1-new" style={style}>
        B1-new
        <div id="C1-new" style={style}>
          C1-new
        </div>
        <div id="C2-new" style={style}>
          C2-new
        </div>
      </div>
      <div id="B2-new" style={style}>
        B2-new
      </div>
      <div id="B3" style={style}>
        B3
      </div>
    </div>
  )
  ReactDOM.render(element2,document.getElementById('root'));
})


let render3=document.getElementById('render3')
render3.addEventListener('click',()=>{
  let element3=(
    <div id="A1-new2" style={style}>
      A1-new2
      <div id="B1-new2" style={style}>
        B1-new2
        <div id="C1-new2" style={style}>
          C1-new2
        </div>
        <div id="C2-new2" style={style}>
          C2-new2
        </div>
      </div>
      <div id="B2-new2" style={style}>
        B2-new2
      </div>
    </div>
  )
  ReactDOM.render(element3,document.getElementById('root'));
}) */

function reducer(state,action){
  switch (action.type){
    case 'ADD':
      return {count:state.count+1}
    default:
      return state
  }
}

function FnComponent(props){
  const [countState,dispatch] = React.useReducer(reducer,{count:0})
  const [countState2,dispatch2] = React.useReducer(reducer,{count:1})

  const [numberState,setNumberState] = React.useState({number:1})
  return(<div>
    <span>{numberState.number}</span>
    <button onClick={()=>setNumberState({number:numberState.number+1})}>useState</button>
    <span>{countState.count}</span>
    <button onClick={()=>dispatch({type:'ADD'})}>useReducer1</button>
    <span>{countState2.count}</span>
    <button onClick={()=>dispatch2({type:'ADD'})}>useReducer2</button>
    <span>我是函数组件</span>
  </div>)
}

class ChildComponent extends React.Component{
  render(){
    return <div>我是子组件</div>
  }
}

class  MyComponent extends React.Component{
  constructor(props){
    super(props)
    this.state={count:0}
  }
  click=()=>{
    this.setState({count:this.state.count+1})
  }

  render(){
    return(
      <div id="counter">
        <span>{this.state.count}</span>
        <button onClick={this.click}>点击</button>
        <ChildComponent/>
        <FnComponent/>
      </div>
    )
  }
}



export default class App extends React.Component{
  render(){
    return (
      <div className="App">
        <MyComponent />
      </div>
    );
  }
}

