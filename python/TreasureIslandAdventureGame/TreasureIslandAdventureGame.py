import random
from typing import Any

health = 100
bandits = 4
def fight(bandits, health):
    chance = random.randint(0, 20)
    if chance > 4:
        print(f"Rolling... \nRolled {chance}. Success!")
        bandits -= 1
        if  bandits > 1:
            choice = input("One bandit has fallen. {bandits} remain. You can stand your ground and fight, or flee. \n")
            if choice == fight:
                fight(Any, Any)
            else:
                input("You should not have fled: I did not code this part yet. LOL Game Over dumbass.")
        elif bandits > 0:
            choice = input("One bandit has fallen. Only one remains. You can stand your ground and fight, or flee. \n")
            if choice == fight:
                fight(Any, Any)
            else: 
                input("You done fucked it up, kid. Game Over.")
        else:
            print("The bandits have been defeated. You can see ahead the empty encampment.")
    else: 
        print("The bandit easily parries your attack, slashing back.")
        health -= random.randint(10, 30)
        print(f"Wounded! Health: {health}")
        if health <= 0:
            input("You fall to your knees, blood gushing out of gaping wounds. The light begins to fade... \nGame Over!")

print("Welcome to the Treasure Island Adventure Game.")
print("Your mission is to find the treasure.")
choice = input("You're at a crossroads. Where do you want to go? Type 'left' or 'right'. \n").lower()
if choice == "left":
    choice = input("You arrive at the ocean. You can wait for a boat, or try to swim across. Type 'wait' or 'swim'. \n").lower()
    if choice == "wait":
        choice = input("The boat takes you across the sea to a small island with a red 'X', a blue 'X', and a yellow 'X'. Where would you like to dig? Type 'red', 'blue', or 'yellow'. \n").lower()
        if choice == "yellow":
            print(f"You strike the {choice} 'X' with your shovel and hear a loud 'thud'.")
            input("Congratulations! You have found the hidden treasure. You win the game!")
        else:
            input(f"You strike the {choice} 'X' with your shovel, and the ground collapses. You fall to your death. Game over.")
    else:
        print("You attempt to swim across the sea, but become exhausted, and drown. Game over.")
else: 
    print("You travel right at the crossroads and are spotted by a group of bandits. You can stand your ground and fight, or flee.")
    choice = input("Type 'fight' or 'flee'. \n").lower()
    if choice == "fight":
        print("You draw your sword and prepare to engage.")
        fight(Any, Any)