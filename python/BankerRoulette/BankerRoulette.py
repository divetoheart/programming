import random

print("Welcome to Banker Roulette. Let's determine who is paying for everyone's bill!")
people = input("Enter the names of all participations. Separate names with a comma. \n")
people = people.split(",")

participants = len(people)
chance = random.randint(0, participants - 1)

input(f"The lucky winner is {people[chance]}, who is kindly paying everyone's bill!")