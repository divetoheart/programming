import React from 'react'
import Button from './Button'

const Header = ({ title }) => {
  return (
    <div>
        <h1>{title}</h1>
        <Button text="Add"/>
    </div>
  )
}

Header.defaultProps = {
    title: 'Task Tracker'
}



export default Header