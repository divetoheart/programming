print("Python Pizza Delivery Service!!")
size = input("What size pizza do you want? \n")

bill = 0
if size == "S":
    bill += 15
elif size == "M":
    bill += 20
elif size == "L":
    bill += 25

add_pepperoni = input("Do you want pepperoni? \n")

if add_pepperoni == "Y":
    if size == "S":
        bill += 2
    else:
        bill += 3

extra_cheese = input("Do you want extra cheese? \n")

if extra_cheese == "Y":
    bill += 1

print(f"Your total bill: ${bill}")