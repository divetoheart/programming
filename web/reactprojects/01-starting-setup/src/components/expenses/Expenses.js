import React, { useState } from "react";

import ExpenseItem from "./ExpenseItem";
import ExpensesFilter from "./ExpensesFilter";
import Card from "../ui/Card";
import "./Expenses.css";

const Expenses = (props) => {
  const [filteredYear, setFilteredYear] = useState("Show All");
  const filteredYearHandler = (selectedYear) => {
    setFilteredYear(selectedYear);
  };

const filteredExpenses = props.items.filter(expense => {
  if(filteredYear !== "Show All") {
   return expense.date.getFullYear().toString() === filteredYear;
  }
  else {
    return true
  }
});

  return (
    <div>
      <Card className="expenses">
        <ExpensesFilter
          selected={filteredYear}
          onChangeFilter={filteredYearHandler}
        />
        {filteredExpenses.map((expense) => (
          <ExpenseItem
            key={expense.id}
            title={expense.title}
            amount={expense.amount}
            date={expense.date}
          />
        ))};
      </Card>
    </div>
  );
};

export default Expenses;
