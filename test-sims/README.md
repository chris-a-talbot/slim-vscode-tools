# Test Simulations

This folder contains various SLiM simulation scripts for testing and demonstration purposes.

## Test Files

### test.slim
**Metapopulation Grid Model**
- Simulates a 3×3 grid of subpopulations (9 total) with 500 individuals each
- Implements bidirectional migration between adjacent subpopulations at a rate of 0.05
- Useful for testing spatial population structure and migration dynamics

### test2.slim
**Demographic-Genetic Evolutionary Rescue Model with RL Integration**
- Based on the demo-genetic evolutionary rescue model by Julian Beaman & Corey Bradshaw
- NonWF (non-Wright-Fisher) model with age structure and demographic stochasticity
- Features two populations: p1 (source population) and p2 (declining population)
- Includes deleterious mutations (m2) with negative fitness effects
- Integrates with reinforcement learning agents through stdin/stdout communication
- Simulates population crash at generation 10,001 with subsequent rescue attempts
- Agent can manage migration from source to declining population
- readLine() is not yet implemented in SLiM, so should return a warning

### test3.slim
**Polygenic Epistasis Model**
- Script by Hilde Schneemann for simulating pairwise epistasis
- Starts with a predefined set of 24 mutations
- Selection coefficients and epistatic effects read from external `epifile.csv` (not included)
- Population state initialized from `popfile.csv` (not included)
- Haploid genome with free recombination and no new mutations
- Runs until all mutations are either fixed or lost
- Tracks mean and variance in fitness throughout the simulation

### test4.slim
**Biallelic Locus with Back Mutations**
- SLiM recipe by Ben Haller demonstrating identity by state and mutation uniquing
- Models a biallelic locus where m2 mutations represent "A" allele and absence represents "a" allele
- Implements back mutations from A to a through mutation stacking and removal
- Uses mutation uniquing to maintain biallelic state
- Logs allele frequencies every 10 generations

### test5.slim
**Continuous Spatial Model with Reprising Boundaries**
- SLiM recipe by Ben Haller demonstrating continuous 2D spatial dynamics
- 500 individuals in continuous XY space with competition interactions
- Implements reprising (reflecting) boundaries where offspring bounce off edges
- Competition based on neighbor density within distance 0.3
- Offspring positioned near parents with small spatial perturbation

### test.eidos
**Predator-Prey Dynamics Simulator (Lotka-Volterra Model)**
- Lotka-Volterra model implemented by Chris Talbot in pure Eidos (no SLiM features)
- Models classic predator-prey dynamics between rabbits (prey) and foxes (predators)
- Includes environmental stochasticity parameter for realistic population fluctuations
- Tracks populations over 400 generations with visual output
- Compares observed dynamics to theoretical equilibrium predictions with deviation analysis
- Useful for testing .eidos file type support and Eidos-only language features

## Visualization Test Scripts

These scripts are specifically designed to test the real-time visualization feature:

### test_viz_simple.slim
**Simple Population Growth**
- Single population (p1) with 500 individuals
- Neutral mutations only (m1)
- Runs for 1000 generations
- Tests basic population size and fitness tracking
- Good starting point for testing visualization

### test_viz_multi.slim
**Multi-Population with Migration**
- Three populations: p1 (1000), p2 (500), p3 (250)
- Two mutation types: neutral (m1) and deleterious (m2)
- Population p3 added dynamically at generation 100
- Migration between populations
- Tests multi-population visualization and dynamic population addition

### test_viz_extinction.slim
**Population Extinction**
- Two populations: p1 (100) and p2 (200)
- Deleterious mutations (m1) with s = -0.3
- Population p1 goes extinct at generation 100
- Tests handling of extinct populations in visualization
- Verifies robust error handling

### test_viz_complex.slim
**Complex Scenario with Bottleneck**
- Three mutation types: neutral, beneficial, deleterious
- Population bottleneck at generation 500 (1000 → 50)
- Recovery at generation 510 (50 → 500)
- Tests selection dynamics and fitness tracking
- Demonstrates visualization during dramatic demographic events
