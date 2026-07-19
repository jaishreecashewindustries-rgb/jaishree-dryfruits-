import React, { createContext, useContext, useReducer, useEffect } from "react";
import toast from "react-hot-toast";

const CartContext = createContext();
export const useCart = () => useContext(CartContext);

const cartReducer = (state, action) => {
  switch (action.type) {
    case "ADD_ITEM": {
      const existing = state.items.find(
        (i) => i.id === action.item.id && i.variantId === action.item.variantId
      );
      if (existing) {
        return {
          ...state,
          items: state.items.map((i) =>
            i.id === action.item.id && i.variantId === action.item.variantId
              ? { ...i, qty: i.qty + (action.item.qty || 1) }
              : i
          ),
        };
      }
      return { ...state, items: [...state.items, { ...action.item, qty: action.item.qty || 1 }] };
    }
    case "REMOVE_ITEM":
      return {
        ...state,
        items: state.items.filter(
          (i) => !(i.id === action.id && i.variantId === action.variantId)
        ),
      };
    case "UPDATE_QTY":
      if (action.qty <= 0) {
        return {
          ...state,
          items: state.items.filter(
            (i) => !(i.id === action.id && i.variantId === action.variantId)
          ),
        };
      }
      return {
        ...state,
        items: state.items.map((i) =>
          i.id === action.id && i.variantId === action.variantId
            ? { ...i, qty: action.qty }
            : i
        ),
      };
    case "CLEAR_CART":
      return { ...state, items: [] };
    case "TOGGLE_CART":
      return { ...state, isOpen: !state.isOpen };
    case "OPEN_CART":
      return { ...state, isOpen: true };
    case "CLOSE_CART":
      return { ...state, isOpen: false };
    default:
      return state;
  }
};

export const CartProvider = ({ children }) => {
  const stored = JSON.parse(localStorage.getItem("jsd_cart") || "[]");
  const [state, dispatch] = useReducer(cartReducer, {
    items: stored,
    isOpen: false,
  });

  useEffect(() => {
    localStorage.setItem("jsd_cart", JSON.stringify(state.items));
  }, [state.items]);

  const addToCart = (item) => {
    dispatch({ type: "ADD_ITEM", item });
    toast.success(`${item.name} added to cart!`, {
      style: { background: "#3E2723", color: "white" },
      iconTheme: { primary: "#C9A84C", secondary: "white" },
    });
    dispatch({ type: "OPEN_CART" });

    // Ad platform conversion signals — both scripts queue calls even before
    // their remote JS finishes loading, so no readiness check needed.
    if (typeof window.fbq === "function") {
      window.fbq("track", "AddToCart", {
        content_ids: [item.id],
        content_name: item.name,
        value: item.price * item.qty,
        currency: "INR",
      });
    }
    if (typeof window.gtag === "function") {
      window.gtag("event", "add_to_cart", {
        currency: "INR",
        value: item.price * item.qty,
        items: [{ item_id: item.id, item_name: item.name, price: item.price, quantity: item.qty }],
      });
    }
  };

  const removeFromCart = (id, variantId) => {
    // Captured before dispatch so the Undo action below can restore the
    // exact item (name, price, qty) — it won't exist in state anymore
    // once REMOVE_ITEM runs.
    const removed = state.items.find((i) => i.id === id && i.variantId === variantId);
    dispatch({ type: "REMOVE_ITEM", id, variantId });
    toast(
      (t) => (
        <span className="flex items-center gap-3">
          Item removed from cart
          <button
            onClick={() => {
              if (removed) dispatch({ type: "ADD_ITEM", item: removed });
              toast.dismiss(t.id);
            }}
            className="font-bold underline underline-offset-2"
            style={{ color: "#C9A84C" }}
          >
            Undo
          </button>
        </span>
      ),
      { style: { background: "#3E2723", color: "white" }, duration: 5000 }
    );
  };

  const updateQty = (id, variantId, qty) => dispatch({ type: "UPDATE_QTY", id, variantId, qty });
  const clearCart = () => dispatch({ type: "CLEAR_CART" });
  const toggleCart = () => dispatch({ type: "TOGGLE_CART" });
  const closeCart = () => dispatch({ type: "CLOSE_CART" });

  const totalItems = state.items.reduce((s, i) => s + i.qty, 0);
  const subtotal = state.items.reduce((s, i) => s + i.price * i.qty, 0);
  const shipping = subtotal >= 999 ? 0 : 99;
  const total = subtotal + shipping;

  return (
    <CartContext.Provider
      value={{
        items: state.items,
        isOpen: state.isOpen,
        totalItems,
        subtotal,
        shipping,
        total,
        addToCart,
        removeFromCart,
        updateQty,
        clearCart,
        toggleCart,
        closeCart,
      }}
    >
      {children}
    </CartContext.Provider>
  );
};
