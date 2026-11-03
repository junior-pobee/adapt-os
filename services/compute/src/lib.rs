use wasm_bindgen::prelude::*;

#[wasm_bindgen]
pub fn calculate_net(income: f64, expenses: f64) -> Result<f64, JsValue> {
    if !income.is_finite() || !expenses.is_finite() || income < 0.0 || expenses < 0.0 {
        return Err(JsValue::from_str("Financial values must be finite and non-negative."));
    }
    Ok(income - expenses)
}

#[wasm_bindgen]
pub fn percentage_used(spent: f64, budget: f64) -> Result<f64, JsValue> {
    if !spent.is_finite() || !budget.is_finite() || spent < 0.0 || budget <= 0.0 {
        return Err(JsValue::from_str("Spent must be non-negative and budget must be positive."));
    }
    Ok((spent / budget * 100.0).min(100.0))
}
