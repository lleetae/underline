export type Json =
    | string
    | number
    | boolean
    | null
    | { [key: string]: Json | undefined }
    | Json[]

export type Database = {
    // Allows to automatically instantiate createClient with right options
    // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
    __InternalSupabase: {
        PostgrestVersion: "13.0.5"
    }
    public: {
        Tables: {
            member: {
                Row: {
                    age: number | null
                    auth_id: string
                    bio: string
                    birth_date: string
                    created_at: string
                    drinking: string
                    gender: string
                    height: number
                    id: string
                    kakao_id: string
                    location: string
                    nickname: string
                    phone_number: string
                    photo_url: string | null
                    photo_urls_blurred: string[] | null
                    photo_urls_original: string[] | null
                    photos: string[] | null
                    religion: string
                    smoking: string
                    referrer_user_id: string | null
                    free_reveals_count: number
                    has_welcome_coupon: boolean
                    fcm_token: string | null
                }
                Insert: {
                    age?: number | null
                    auth_id: string
                    bio: string
                    birth_date: string
                    created_at?: string
                    drinking: string
                    gender: string
                    height: number
                    id?: string
                    kakao_id: string
                    location: string
                    nickname: string
                    phone_number: string
                    photo_url?: string | null
                    photo_urls_blurred?: string[] | null
                    photo_urls_original?: string[] | null
                    photos?: string[] | null
                    religion: string
                    smoking: string
                    referrer_user_id?: string | null
                    free_reveals_count?: number
                    has_welcome_coupon?: boolean
                    fcm_token?: string | null
                }
                Update: {
                    age?: number | null
                    auth_id?: string
                    bio?: string
                    birth_date?: string
                    created_at?: string
                    drinking?: string
                    gender?: string
                    height?: number
                    id?: string
                    kakao_id?: string
                    location?: string
                    nickname?: string
                    phone_number?: string
                    photo_url?: string | null
                    photo_urls_blurred?: string[] | null
                    photo_urls_original?: string[] | null
                    photos?: string[] | null
                    religion?: string
                    smoking?: string
                    referrer_auth_id: string | null
                    free_reveals_count?: number
                    has_welcome_coupon?: boolean
                    fcm_token?: string | null
                }
                Relationships: []
            }
            member_books: {
                Row: {
                    id: string
                    member_id: string
                    book_title: string
                    book_author: string | null
                    book_cover: string | null
                    book_genre: string | null
                    book_isbn13: string | null
                    book_review: string | null
                    created_at: string
                }
                Insert: {
                    id?: string
                    member_id: string
                    book_title: string
                    book_author?: string | null
                    book_cover?: string | null
                    book_genre?: string | null
                    book_isbn13?: string | null
                    book_review?: string | null
                    created_at?: string
                }
                Update: {
                    id?: string
                    member_id?: string
                    book_title?: string
                    book_author?: string | null
                    book_cover?: string | null
                    book_genre?: string | null
                    book_isbn13?: string | null
                    book_review?: string | null
                    created_at?: string
                }
                Relationships: [
                    {
                        foreignKeyName: "member_books_member_id_fkey"
                        columns: ["member_id"]
                        isOneToOne: false
                        referencedRelation: "member"
                        referencedColumns: ["id"]
                    }
                ]
            }
            dating_applications: {
                Row: {
                    id: string
                    member_id: string
                    status: string
                    created_at: string
                }
                Insert: {
                    id?: string
                    member_id: string
                    status?: string
                    created_at?: string
                }
                Update: {
                    id?: string
                    member_id?: string
                    status?: string
                    created_at?: string
                }
                Relationships: [
                    {
                        foreignKeyName: "dating_applications_member_id_fkey"
                        columns: ["member_id"]
                        isOneToOne: false
                        referencedRelation: "member"
                        referencedColumns: ["id"]
                    }
                ]
            }
            match_requests: {
                Row: {
                    id: string
                    sender_id: string
                    receiver_id: string
                    letter: string
                    status: string
                    created_at: string
                }
                Insert: {
                    id?: string
                    sender_id: string
                    receiver_id: string
                    letter: string
                    status?: string
                    created_at?: string
                }
                Update: {
                    id?: string
                    sender_id?: string
                    receiver_id?: string
                    letter?: string
                    status?: string
                    created_at?: string
                }
                Relationships: [
                    {
                        foreignKeyName: "match_requests_sender_id_fkey"
                        columns: ["sender_id"]
                        isOneToOne: false
                        referencedRelation: "member"
                        referencedColumns: ["id"]
                    },
                    {
                        foreignKeyName: "match_requests_receiver_id_fkey"
                        columns: ["receiver_id"]
                        isOneToOne: false
                        referencedRelation: "member"
                        referencedColumns: ["id"]
                    }
                ]
            }
            region_match_status: {
                Row: {
                    region_id: string
                    is_open: boolean
                    created_at: string
                }
                Insert: {
                    region_id: string
                    is_open?: boolean
                    created_at?: string
                }
                Update: {
                    region_id?: string
                    is_open?: boolean
                    created_at?: string
                }
                Relationships: []
            }
        }
        Views: {
            [_ in never]: never
        }
        Functions: {
            [_ in never]: never
        }
        Enums: {
            [_ in never]: never
        }
        CompositeTypes: {
            [_ in never]: never
        }
    }
}

type PublicSchema = Database[Extract<keyof Database, "public">]

export type Tables<
    PublicTableNameOrOptions extends
    | keyof (PublicSchema["Tables"] & PublicSchema["Views"])
    | { schema: "public" },
    TableName extends PublicTableNameOrOptions extends { schema: "public" }
    ? keyof (Database[PublicTableNameOrOptions["schema"]]["Tables"] &
        Database[PublicTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = PublicTableNameOrOptions extends { schema: "public" }
    ? (Database[PublicTableNameOrOptions["schema"]]["Tables"] &
        Database[PublicTableNameOrOptions["schema"]]["Views"])[TableName] extends {
            Row: infer R
        }
    ? R
    : never
    : PublicTableNameOrOptions extends keyof (PublicSchema["Tables"] &
        PublicSchema["Views"])
    ? (PublicSchema["Tables"] &
        PublicSchema["Views"])[PublicTableNameOrOptions] extends {
            Row: infer R
        }
    ? R
    : never
    : never

export type TablesInsert<
    PublicTableNameOrOptions extends
    | keyof PublicSchema["Tables"]
    | { schema: "public" },
    TableName extends PublicTableNameOrOptions extends { schema: "public" }
    ? keyof Database[PublicTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = PublicTableNameOrOptions extends { schema: "public" }
    ? Database[PublicTableNameOrOptions["schema"]]["Tables"][TableName] extends {
        Insert: infer I
    }
    ? I
    : never
    : PublicTableNameOrOptions extends keyof PublicSchema["Tables"]
    ? PublicSchema["Tables"][PublicTableNameOrOptions] extends {
        Insert: infer I
    }
    ? I
    : never
    : never

export type TablesUpdate<
    PublicTableNameOrOptions extends
    | keyof PublicSchema["Tables"]
    | { schema: "public" },
    TableName extends PublicTableNameOrOptions extends { schema: "public" }
    ? keyof Database[PublicTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = PublicTableNameOrOptions extends { schema: "public" }
    ? Database[PublicTableNameOrOptions["schema"]]["Tables"][TableName] extends {
        Update: infer U
    }
    ? U
    : never
    : PublicTableNameOrOptions extends keyof PublicSchema["Tables"]
    ? PublicSchema["Tables"][PublicTableNameOrOptions] extends {
        Update: infer U
    }
    ? U
    : never
    : never

export type Enums<
    PublicEnumNameOrOptions extends
    | keyof PublicSchema["Enums"]
    | { schema: "public" },
    EnumName extends PublicEnumNameOrOptions extends { schema: "public" }
    ? keyof Database[PublicEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = PublicEnumNameOrOptions extends { schema: "public" }
    ? Database[PublicEnumNameOrOptions["schema"]]["Enums"][EnumName]
    : PublicEnumNameOrOptions extends keyof PublicSchema["Enums"]
    ? PublicSchema["Enums"][PublicEnumNameOrOptions]
    : never

export type CompositeTypes<
    PublicCompositeTypeNameOrOptions extends
    | keyof PublicSchema["CompositeTypes"]
    | { schema: "public" },
    CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
        schema: keyof Database
    }
    ? keyof Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends { schema: "public" }
    ? Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
    : PublicCompositeTypeNameOrOptions extends keyof PublicSchema["CompositeTypes"]
    ? PublicSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never
