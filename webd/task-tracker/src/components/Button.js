

const Button = ({text, backgroundColor, color}) => {
    const onClick = (e) => {
        console.log('Click')
    }
       return  <button onClick={onClick} className='btn' style={{backgroundColor, color}}>{text}</button>
}

Button.defaultProps = {
    backgroundColor: 'steelblue',
    color: 'white'
}

export default Button