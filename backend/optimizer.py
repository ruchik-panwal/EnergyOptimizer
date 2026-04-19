import numpy as np
from scipy.optimize import minimize

# --- HARDWARE CONSTANTS (From Research Paper Section 3.1 & 6) ---
# Diesel Engine Cost Coefficients (a*P^2 + b*P + c) [cite: 238]
DIESEL_A = 0.05
DIESEL_B = 0.2
DIESEL_C = 1.5

# Battery Degradation Coefficients (k1, k2, k3) [cite: 283, 298]
K1, K2, K3 = 0.01, 0.02, 0.03
LAMBDA_W = 0.5  # Weighting factor for battery life significance [cite: 291]

def run_optimization(load, pv, wind, grid_price, ev_at_home=True):
    """
    Finds the cheapest power dispatch using Lagrange and KKT principles.
    Variables: [Pg, Pde, Pess, Pev]
    """
    
    # 1. SETTING CONSTRAINTS (KKT Inequality Conditions) [cite: 197, 242]
    # Power limits [Min Power, Max Power] from Table 1 of the paper [cite: 191]
    ev_min, ev_max = (-38, 38) if ev_at_home else (0, 0)
    
    bounds = (
        (-40, 80),      # National Grid limits (Pg) [cite: 191]
        (5, 30),        # Diesel Engine limits (Pde) [cite: 191]
        (-30, 30),      # Stationary Battery limits (Pess) [cite: 191]
        (ev_min, ev_max) # EV Built-in Battery limits (Pev) [cite: 191]
    )

    # 2. THE OBJECTIVE FUNCTION (Equation 13) [cite: 303, 649]
    def objective(x):
        p_grid, p_de, p_ess, p_ev = x
        
        # Grid cost: cg(t) * Pg(t) [cite: 647]
        f_grid = grid_price * p_grid
        
        # Diesel cost: a*Pde^2 + b*Pde + c [cite: 238]
        f_de = DIESEL_A * p_de**2 + DIESEL_B * p_de + DIESEL_C
        
        # Battery degradation cost (Lifespan optimization) [cite: 283]
        f_ess = K1 * (1 - K2 * 0.5 + K3 * 0.5**2) * (-1 + 1/LAMBDA_W) * abs(p_ess)
        f_ev = K1 * (1 - K2 * 0.5 + K3 * 0.5**2) * (-1 + 1/LAMBDA_W) * abs(p_ev)
        
        return f_grid + f_de + f_ess + f_ev

    # 3. THE EQUALITY CONSTRAINT (Unit 5.1 - Lagrange) [cite: 195, 202]
    def power_balance(x):
        p_grid, p_de, p_ess, p_ev = x
        # Supply + Renewables - Load = 0 (Equation 4) [cite: 249]
        return p_grid + p_de + p_ess + p_ev + pv + wind - load

    # 4. SOLVER (Calculates the Lagrangian) [cite: 200, 207]
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