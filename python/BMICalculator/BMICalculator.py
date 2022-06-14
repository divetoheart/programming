print("Welcome to the BMI Calculator. \n")
height = float(input("Enter your height in cm: \n"))/100    #converts cm to m
weight = input("Enter your weight in kg: \n")
bmi = float(weight) / (float(height) * float(height))       #Calculate weight divided by height squared
if bmi < 18.5:
    print("You are underweight.")
elif bmi < 25:
    print("You are a normal weight.")
elif bmi < 30:
    print("You are overweight.")
elif bmi < 35:
    print("You are obese.")
else:
    print("You are clinically obese.")