import numpy as np
from scipy.optimize import minimize

# Diesel Engine Cost Coefficients (a*P^2 + b*P + c)
DieselA = 0.05
DieselB = 0.2
DieselC = 1.5

# # Battery Degradation Coefficients (k1, k2, k3)
K1, K2, K3 = 0.01, 0.02, 0.03
lamdaW = 0.5  # Weighting factor for battery life significance 

# Finds the cheapest power dispatch using Lagrange and KKT principles.
# Variables: [Pg, Pde, Pess, Pev]
def run_optimization(load, solar, wind, GridPrice, EVatHome=True):

    # 1. SETTING CONSTRAINTS (KKT Inequality Conditions)
    # Power limits [Min Power, Max Power]
    EVmin, EVmax = (-38, 38) if EVatHome else (0, 0)

    bounds = (
        (-40, 80),  # National Grid limits (Pg) 
        (5, 30),  # Diesel Engine limits (Pde) 
        (-30, 30),  # Stationary Battery limits (Pess) 
        (EVmin, EVmax),  # EV Built-in Battery limits (Pev) 
    )

    def objective(x):
        PowGrid, PowDieselGen, PowEnergySys, PowElecVehicle = x

        # Grid cost: cg(t) * Pg(t)
        FunGrid = GridPrice * PowGrid
        
        # Diesel cost: a*Pde^2 + b*Pde + c
        FunDiesel = DieselA * PowDieselGen**2 + DieselB * PowDieselGen + DieselC

        # Battery degradation cost (Lifespan optimization) [cite: 283]
        FunESS = (
            K1 * (1 - K2 * 0.5 + K3 * 0.5**2) * (-1 + 1 / lamdaW) * abs(PowEnergySys)
        )
        FunEV = (
            K1 * (1 - K2 * 0.5 + K3 * 0.5**2) * (-1 + 1 / lamdaW) * abs(PowElecVehicle)
        )

        return FunGrid + FunDiesel + FunESS + FunEV

    # THE EQUALITY CONSTRAINT
    def power_balance(x):
        PowGrid, PowDieselGen, PowEnergySys, PowElecVehicle = x
        
        # Supply + Renewables - Load = 0 
        return PowGrid + PowDieselGen + PowEnergySys + PowElecVehicle + solar + wind - load    

    # Initial guess [Grid, Diesel, ESS, EV]
    x0 = [0, 5, 0, 0]

    # SLSQP solver handles both Equality (Lagrange) and Inequality (KKT) constraints
    result = minimize(
        objective,
        x0,
        method='SLSQP',
        bounds=bounds,
        constraints={'type': 'eq', 'fun': power_balance}
    )

    return result