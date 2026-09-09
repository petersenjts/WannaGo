"use server";

import { db } from "@/lib/db";
import { findOrCreateCustomer } from "@/lib/customers";

export type SubmitState = { error?: string; success?: boolean };

function str(formData: FormData, key: string): string {
  return String(formData.get(key) ?? "").trim();
}

export async function submitStayRequest(
  _prevState: SubmitState,
  formData: FormData
): Promise<SubmitState> {
  const name = str(formData, "name");
  const email = str(formData, "email");
  const phone = str(formData, "phone");
  const city = str(formData, "city");
  const checkIn = str(formData, "checkIn");
  const checkOut = str(formData, "checkOut");
  const guests = Number(formData.get("guests"));
  const budgetPerNight = Number(formData.get("budgetPerNight"));
  const tags = formData.getAll("tags").map(String);
  const notes = str(formData, "notes");

  if (!name) return { error: "Please enter your name." };
  if (!email && !phone) {
    return { error: "Please provide an email or phone number so we can reach you." };
  }
  if (!city) return { error: "Please tell us which city." };
  if (!checkIn || !checkOut) {
    return { error: "Please provide check-in and check-out dates." };
  }
  if (new Date(checkOut) <= new Date(checkIn)) {
    return { error: "Check-out must be after check-in." };
  }
  if (!guests || guests < 1) return { error: "Please enter the number of guests." };
  if (!budgetPerNight || budgetPerNight <= 0) {
    return { error: "Please enter a budget per night." };
  }

  const customer = await findOrCreateCustomer({ name, email, phone });

  await db.request.create({
    data: {
      vertical: "STAY",
      customerId: customer.id,
      city,
      consumerNotes: notes || null,
      stayDetails: {
        create: {
          checkIn: new Date(checkIn),
          checkOut: new Date(checkOut),
          guests,
          budgetPerNight,
          preferenceTags: tags,
        },
      },
    },
  });

  return { success: true };
}

export async function submitDiningRequest(
  _prevState: SubmitState,
  formData: FormData
): Promise<SubmitState> {
  const name = str(formData, "name");
  const email = str(formData, "email");
  const phone = str(formData, "phone");
  const city = str(formData, "city");
  const date = str(formData, "date");
  const time = str(formData, "time");
  const partySize = Number(formData.get("partySize"));
  const budgetPerPerson = Number(formData.get("budgetPerPerson"));
  const occasion = str(formData, "occasion");
  const cuisine = str(formData, "cuisine");
  const dietaryNeeds = str(formData, "dietaryNeeds");
  const notes = str(formData, "notes");

  if (!name) return { error: "Please enter your name." };
  if (!email && !phone) {
    return { error: "Please provide an email or phone number so we can reach you." };
  }
  if (!city) return { error: "Please tell us which city." };
  if (!date || !time) return { error: "Please provide a date and time." };
  if (!partySize || partySize < 1) return { error: "Please enter your party size." };
  if (!budgetPerPerson || budgetPerPerson <= 0) {
    return { error: "Please enter a budget per person." };
  }

  const customer = await findOrCreateCustomer({ name, email, phone });

  await db.request.create({
    data: {
      vertical: "DINE",
      customerId: customer.id,
      city,
      consumerNotes: notes || null,
      diningDetails: {
        create: {
          date: new Date(date),
          time,
          partySize,
          budgetPerPerson,
          occasion: occasion || null,
          cuisine: cuisine || null,
          dietaryNeeds: dietaryNeeds || null,
        },
      },
    },
  });

  return { success: true };
}
