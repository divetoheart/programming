import random

print("Welcome to M.A.S.H.!")
playerName = input("What is your name? \n")
names = input("First, list the names of a few friends and a few enemies, separating each name with a comma. \n")
names = names.split(",")
places = input("Now, list a few places where you would love to live, and a few where you wouldn't! \n")
places = places.split(",")
jobs = input("Let's figure out what you do for a living. List a few dream jobs, and a few of the worst professions you can imagine... \n")
jobs = jobs.split(",")
kids = input("Life isn't complete without kids! Unless you don't want any... but give me a few different numbers to work with. \n")
kids = kids.split(",")
cars = input("You'll have to get around somehow, so now list a few vehicles you'd love to drive, and some that are no good. \n\n")
cars = cars.split(",")
homes = ["Mansion", "Apartment", "Shack", "House"]
result = [names[random.randint(0, len(names) -1)], places[random.randint(0, len(places) -1)], jobs[random.randint(0, len(jobs) -1)], kids[random.randint(0, len(kids) -1)], cars[random.randint(0, len(cars) - 1)], homes[random.randint(0, len(homes) -1)]]
print(f"{playerName} will be married to {result[0]}. \nThey will live in {result[1]}, in a {result[5]}, with {result[3]} kids. \n{playerName} will work as a {result[2]} and will drive a {result[4]}. \n")
input("Thanks for playing! \n")