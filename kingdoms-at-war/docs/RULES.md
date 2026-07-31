# Core Rules

## Campaign

- One human and three AI kingdoms begin in distant regions.
- The procedural world contains twenty regions.
- Every region contains exactly three connected physical slots.
- The first kingdom to eliminate every rival or control at least 70% of constructed buildings after reaching ten buildings wins.

## Regions and slots

Buildings and Armies exist on slots. Movement follows graph edges one slot at a time.

An empty slot:

- can be occupied
- can block movement and supply paths
- may carry strategically important terrain
- cannot be captured or owned

A region can be Secure, Occupied, Contested, Hostile, or Unsettled. Building ownership is always authoritative; region control is derived.

## Buildings

Each region can contain at most:

- two Civil buildings
- two Military buildings
- one Temple

Available buildings:

- Village
- City
- Fortress
- Castle
- Temple

Village upgrades to City. Fortress upgrades to Castle. Direct Cities and Castles are deliberately expensive and require an already established region.

Construction is immediate because resources are the waiting mechanism. It requires secure ownership of every existing building and no mobile Armies anywhere in the region. Repairs are immediate when hostile forces and sieges are absent.

## Regional support and composition

Buildings support one another while owned by the same kingdom.

- Cities distribute Supply and reduce regional upkeep.
- Villages replenish Provisions and support local Supply.
- Fortresses and Castles improve regional defense and Garrison performance.
- Temples improve morale and reduce desertion pressure.

When all three slots are built, controlled by one kingdom, supplied, and free of hostile Armies, the exact composition activates a regional role such as Sacred Bastion, Holy Metropolis, Marchland, Crownland, or Pilgrim March.

Capture order therefore matters. Taking a City weakens regional Supply. Taking a Castle removes defensive coordination. Taking a Temple removes morale support and gives the attacking Army loot, morale, Fervor, and desertion relief.

## Population and military capacity

Recruitment requires both:

- available local Population
- available kingdom-wide Troop Cap

Every formation consumes real Population. Siege Trains require crews. Warships require sailors and transport capacity. Military buildings provide Troop Cap but consume resources. Civil buildings are costly, vulnerable investments that increase Population Cap and production.

## Armies and Garrisons

These are the only two troop containers.

Armies:

- move and attack
- consume Supply while campaigning
- accumulate Desertion Pressure
- can split and merge
- can begin persistent sieges

Garrisons:

- belong to an individual building
- cost 25% more upkeep
- receive building and regional defensive bonuses
- do not suffer ordinary Army desertion
- can be mobilized into an Army

Any building may hold a Garrison, but its capacity and physical defense vary dramatically.

## Combat

Combat uses:

- troop-type base strength
- counter matchups
- Morale
- Supply
- kingdom Fervor
- terrain effects
- local defensive support
- current Fortification
- narrow deterministic randomness

The interface reveals universal facts but never calculates success for the player. It shows terrain, visible formations, Garrison size, Supply, Fortification, and known building effects. No victory percentage, advantage color, or predicted casualty range is displayed.

Battles resolve through up to twelve visible ticks. Each tick shows remaining formations, casualties, Morale, Supply, terrain, and Fortification. Routed mobile defenders attempt to retreat to a legal friendly slot. Garrisons do not retreat normally.

## Siege

A siege Army remains adjacent to a hostile City, Fortress, or Castle. Each siege action resolves through six visible ticks, reducing:

- Fortification
- stored Supply
- Garrison morale
- besieger Supply

Siege units accelerate wall damage. Regional City and Temple support make a target harder to starve and demoralize. A Garrison surrenders when morale collapses or when both walls and Supply are exhausted.

## Faith

Fervor is kingdom-wide. Morale and Desertion Pressure belong to individual Armies or Garrisons.

Temples generate Gold and Fervor, improve local growth, stabilize morale, and reduce desertion accumulation. Fervor improves military cohesion and retreat survival but is not magical armor.

## Terrain

Terrain modifies movement cost, Population Cap, growth, resource production, defense, and unit performance.

- Plains favor movement and Cavalry.
- Farmland strongly supports Population and Provisions.
- Forests produce Materials and favor Archers.
- Hills and Mountains favor defenders.
- Wetlands slow movement and severely hinder Cavalry.
- Arid regions are difficult to populate and supply.
- Coastal regions can recruit Warships from Military buildings and use sea lanes.
