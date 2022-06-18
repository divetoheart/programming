class Warrior:
    def _init_(self, name, health, attack):
        self.name = "Warrior"
        self.health = 150
        self.attack = 25

class Sorcerer:
    def _init_(self, name, health, attack):
        self.name = "Sorcerer"
        self.health = 100
        self.attack = 40

class Wretch:
    def _init_(self, name, health, attack):
        self.name = "Wretch"
        self.health = 50
        self.attack = 10

PlayerClass = input("Choose your Class: \n1:Warrior      2:Sorcerer        3:Wretch\n")
PlayerClasses = {Warrior(), Sorcerer(), Wretch()}

if PlayerClass == 1:
    PlayerClass = Warrior()
elif PlayerClass == 2:
    PlayerClass = Sorcerer()
else:
    PlayerClass = Wretch()

print(PlayerClass.self.health)