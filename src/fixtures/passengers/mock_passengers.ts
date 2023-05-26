import { CreateOrderPayload } from "../../types/CreateOrderPayload";

const mockPassengers: CreateOrderPayload["passengers"] = [
  {
    id: "pas_0000AUde3KY1SptM6ABSfU",
    given_name: "Mae",
    family_name: "Jemison",
    gender: "F",
    title: "dr",
    born_on: "1956-10-17",
    email: "m.jemison@nasa.gov",
    phone_number: "+16177562626",
  },
  {
    id: "pas_0000AUde3KY1SptM6ABSfT",
    given_name: "Dorothy",
    family_name: "Green",
    gender: "F",
    title: "dr",
    born_on: "1942-10-17",
    email: "m.jemison@nasa.gov",
    phone_number: "+16177562626",
  },
];

export default mockPassengers;
