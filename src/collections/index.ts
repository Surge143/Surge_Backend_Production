import { Admins } from "./Users/Admins";
import { AppCategories } from "./AppCategories/AppCategories";
import { AppSubCategories } from "./AppCategories/AppSubCategories";
import { AppOrders } from "./AppOrders/AppOrders";
import { AppCart } from "./AppCart/AppCart";
import { Coupon } from "./Coupon/Coupon";
import { CustomizationTemplate } from "./AppCategories/CustomizationTemplate";
import { Media } from "./Media";
import { Menu } from "./Menu/Menu";
import { Otp } from "./Otp/Otp";
import { Shop } from "./Shop/Shop";
import { ShopCoupons } from "./ShopCoupons/ShopCoupons";
import { ShopMenu } from "./ShopMenu/ShopMenu";
import { WebCategories } from "./WebCategories/WebCategories";
import { WebSubCategories } from "./WebCategories/WebSubCategories";
import { Wishlist } from "./Wishlist/Wishlist";
import { Users } from "./Users/Users";
import { WebProducts } from "./WebProducts/WebProducts";
import { WebCart } from "./WebCart/WebCart";

export const collections = [
    Users,
    Admins,
    AppCategories,
    Media,
    AppSubCategories,
    CustomizationTemplate,
    Menu,
    Shop,
    ShopMenu,
    Coupon,
    ShopCoupons,
    Otp,
    AppCart,
    Wishlist,
    AppOrders,
    WebCategories,
    WebSubCategories,
    WebProducts,
    WebCart
]