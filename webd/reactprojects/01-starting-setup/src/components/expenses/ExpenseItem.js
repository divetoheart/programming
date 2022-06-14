import React from "react";

import "./ExpenseItem.css";
import ExpenseDate from "./ExpenseDate";
import Card from "../ui/Card";
import DeleteButton from "./DeleteButton";

const ExpenseItem = (props) => {

  return (
    <Card className="expense-item">
      <ExpenseDate date={props.date} />
      <div className="expense-item__description">
        <h2>{props.title}</h2>
        <div className="expense-item__price">${props.amount}</div>
      </div>
      <DeleteButton />
    </Card>
  );
};

export default ExpenseItem;
