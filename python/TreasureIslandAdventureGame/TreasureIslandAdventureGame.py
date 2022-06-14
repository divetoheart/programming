import random


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
        print("You draw your sword. There are three bandits remaining. Rolling: ")
        chance = random.randint(0, 20) 
        if chance > 4:
            print(f"Rolled {chance}. Success!")
            choice = input("One bandit has fallen. Two remain. You can fight, or flee. Type 'fight' or 'flee'. \n")
            if choice == "fight":
                print("There are two bandits remaining. Rolling: ")
                chance = random.randint(0, 20) 
                if chance > 4:
                    print(f"Rolled {chance}. Success!")
                    choice = input("You slay another bandit. Only one remains. Type 'fight' or 'flee'. \n")
                    if choice == "fight":
                        print("You advance onto the final bandit. Rolling: ")
                        chance = random.randint(0, 20) 
                        if chance > 4:
                            print(f"Rolled {chance}. Success!")
                            print("You have successfully slain all of the bandits. You enter their camp, and loot their treasure.")
                            input("Congratulations! You have won the game. Thanks for playing!")
                        else:
                            print(f"Rolled {chance}. Failure!")
                            input("The bandit parries your attack easily, then pierces your heart. Game over.")
                    else:
                        print("You turn around, sprinting back to the crossroads.")
                        choice = input("You arrive at the ocean. You can wait for a boat, or try to swim across. Type 'wait' or 'swim'. \n").lower()
                        if choice == "wait":
                            input("The bandits catch up and you are quickly overwhelmed. You feel a sharp pain as one's sword slides into your gut. Game over.")
                        else:
                            print("You attempt to swim across the sea, but become exhausted, and drown. Game over.")
                            input("Thanks for playing!")
                else:
                    print(f"Rolled {chance}. Failure!")
                    input("The bandit parries your attack easily, then pierces your heart. Game over.")
            else:
                print("You turn around, sprinting back to the crossroads.")
                choice = input("You arrive at the ocean. You can wait for a boat, or try to swim across. Type 'wait' or 'swim'. \n").lower()
                if choice == "wait":
                    input("The bandits catch up and you are quickly overwhelmed. You feel a sharp pain as one's sword slides into your gut. Game over.")
                else:
                    print("You attempt to swim across the sea, but become exhausted, and drown. Game over.")
                    input("Thanks for playing!")
        else:
            print(f"Rolled {chance}. Failure!")
            input("The bandit parries your attack easily, then pierces your heart. Game over.")
    else:
        print("You turn around, sprinting back to the crossroads.")
        choice = input("You arrive at the ocean. You can wait for a boat, or try to swim across. Type 'wait' or 'swim'. \n").lower()
        if choice == "wait":
            input("The bandits catch up and you are quickly overwhelmed. You feel a sharp pain as one's sword slides into your gut. Game over.")
        else:
            print("You attempt to swim across the sea, but become exhausted, and drown. Game over.")
            input("Thanks for playing!")      
