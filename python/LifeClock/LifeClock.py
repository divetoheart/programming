print("This is a little morbid, but let's assume you are only \ngoing to live to be 90 years old.")
age = input("How old are you right now? \n")

#calculations for input age and age 90
years_remaining = 90 - int(age)
days_remaining = years_remaining * 365
weeks_remaining = years_remaining * 52
months_remaining = years_remaining * 12

input(f"You have {days_remaining} days, {weeks_remaining} weeks, or {months_remaining} months remaining.")