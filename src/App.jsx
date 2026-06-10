import { useState, useEffect } from "react";

function load(key) {
  try { const v = localStorage.getItem(key); return v ? JSON.parse(v) : null; }
  catch { return null; }
}
function save(key, val) {
  try { localStorage.setItem(key, JSON.stringify(val)); return true; }
  catch { return false; }
}

const ADMIN_PIN_KEY = "ts:admin_pin";
const KARYW_PIN_KEY = "ts:karyw_pin";
const TAGIHAN_KEY   = "ts:tagihan";
const MUTASI_KEY    = "ts:mutasi";
const HUTANG_KEY    = "ts:hutang";
const DEFAULT_ADMIN = "1234";
const DEFAULT_KARYW = "5678";

const G = {
  dark:"#1B4332", mid:"#2D6A4F", light:"#40916C",
  pale:"#D8F3DC", cream:"#F0FFF4", white:"#FFFFFF",
  red:"#9B2226", redPale:"#FFE8E8",
  amber:"#7A5200", amberPale:"#FFF3CD",
  blue:"#1F4E79", bluePale:"#E8F4FD",
  gray:"#6B7280", border:"#E5E7EB", bg:"#F8FAF9",
};
