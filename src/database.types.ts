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
    PostgrestVersion: "12.2.3 (519615d)"
  }
  public: {
    Tables: {
      albumparts: {
        Row: {
          albumid: number
          id: number
          name: string | null
          pos: string
        }
        Insert: {
          albumid: number
          id?: number
          name?: string | null
          pos: string
        }
        Update: {
          albumid?: number
          id?: number
          name?: string | null
          pos?: string
        }
        Relationships: [
          {
            foreignKeyName: "AlbumParts_albumId_fkey"
            columns: ["albumid"]
            isOneToOne: false
            referencedRelation: "albums"
            referencedColumns: ["id"]
          },
        ]
      }
      albums: {
        Row: {
          artist: string | null
          basicgenreid: number | null
          catalogid: string | null
          coverfilepath: string | null
          id: number
          label: string | null
          mixed: boolean
          name: string | null
          releasedateday: number | null
          releasedatemonth: number | null
          releasedateyear: number | null
        }
        Insert: {
          artist?: string | null
          basicgenreid?: number | null
          catalogid?: string | null
          coverfilepath?: string | null
          id?: number
          label?: string | null
          mixed?: boolean
          name?: string | null
          releasedateday?: number | null
          releasedatemonth?: number | null
          releasedateyear?: number | null
        }
        Update: {
          artist?: string | null
          basicgenreid?: number | null
          catalogid?: string | null
          coverfilepath?: string | null
          id?: number
          label?: string | null
          mixed?: boolean
          name?: string | null
          releasedateday?: number | null
          releasedatemonth?: number | null
          releasedateyear?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "Albums_basicGenreId_fkey"
            columns: ["basicgenreid"]
            isOneToOne: false
            referencedRelation: "basicgenres"
            referencedColumns: ["id"]
          },
        ]
      }
      basicgenres: {
        Row: {
          id: number
          name: string
        }
        Insert: {
          id?: number
          name: string
        }
        Update: {
          id?: number
          name?: string
        }
        Relationships: []
      }
      changes: {
        Row: {
          createdat: string
          field: string | null
          id: number
          key: number | null
          table: string | null
          value: string | null
        }
        Insert: {
          createdat?: string
          field?: string | null
          id?: number
          key?: number | null
          table?: string | null
          value?: string | null
        }
        Update: {
          createdat?: string
          field?: string | null
          id?: number
          key?: number | null
          table?: string | null
          value?: string | null
        }
        Relationships: []
      }
      mixes: {
        Row: {
          addon: boolean
          bpmdiff: number | null
          comments: string | null
          id: number
          insongid: number
          outsongid: number
          rating: number | null
        }
        Insert: {
          addon?: boolean
          bpmdiff?: number | null
          comments?: string | null
          id?: number
          insongid: number
          outsongid: number
          rating?: number | null
        }
        Update: {
          addon?: boolean
          bpmdiff?: number | null
          comments?: string | null
          id?: number
          insongid?: number
          outsongid?: number
          rating?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "mixes_insongid_fkey"
            columns: ["insongid"]
            isOneToOne: false
            referencedRelation: "songs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "mixes_outsongid_fkey"
            columns: ["outsongid"]
            isOneToOne: false
            referencedRelation: "songs"
            referencedColumns: ["id"]
          },
        ]
      }
      musicvideos: {
        Row: {
          filepath: string | null
          id: number
          thumbnailfilepath: string | null
        }
        Insert: {
          filepath?: string | null
          id?: number
          thumbnailfilepath?: string | null
        }
        Update: {
          filepath?: string | null
          id?: number
          thumbnailfilepath?: string | null
        }
        Relationships: []
      }
      playlistentries: {
        Row: {
          id: number
          playlistid: number
          position: number | null
          songid: number
        }
        Insert: {
          id?: number
          playlistid: number
          position?: number | null
          songid: number
        }
        Update: {
          id?: number
          playlistid?: number
          position?: number | null
          songid?: number
        }
        Relationships: [
          {
            foreignKeyName: "playlistentries_playlistid_fkey"
            columns: ["playlistid"]
            isOneToOne: false
            referencedRelation: "playlists"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "playlistentries_songid_fkey"
            columns: ["songid"]
            isOneToOne: false
            referencedRelation: "songs"
            referencedColumns: ["id"]
          },
        ]
      }
      playlists: {
        Row: {
          gmusicid: string | null
          id: number
          name: string | null
          query: string | null
          spotifyid: string | null
          youtubeid: string | null
        }
        Insert: {
          gmusicid?: string | null
          id?: number
          name?: string | null
          query?: string | null
          spotifyid?: string | null
          youtubeid?: string | null
        }
        Update: {
          gmusicid?: string | null
          id?: number
          name?: string | null
          query?: string | null
          spotifyid?: string | null
          youtubeid?: string | null
        }
        Relationships: []
      }
      playliststyles: {
        Row: {
          playlistid: number
          styleid: number
        }
        Insert: {
          playlistid: number
          styleid: number
        }
        Update: {
          playlistid?: number
          styleid?: number
        }
        Relationships: [
          {
            foreignKeyName: "playliststyles_playlistid_fkey"
            columns: ["playlistid"]
            isOneToOne: false
            referencedRelation: "playlists"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "playliststyles_styleid_fkey"
            columns: ["styleid"]
            isOneToOne: false
            referencedRelation: "styles"
            referencedColumns: ["id"]
          },
        ]
      }
      songs: {
        Row: {
          albumid: number | null
          albumpartid: number | null
          artist: string | null
          bpm: number | null
          bpmlock: boolean
          comments: string | null
          curator: string | null
          dateadded: string
          dupeid: number | null
          durationinms: number | null
          energy: number | null
          featuring: string | null
          filepath: string | null
          googlesongid: string | null
          id: number
          lowquality: boolean
          musicvideoid: number | null
          rating: number | null
          remixer: string | null
          resongid: number | null
          search_text: string | null
          spotifyid: string | null
          title: string | null
          tonickey: string | null
          tonickeylock: boolean
          track: string | null
          trashed: boolean
          youtubeid: string | null
          youtubemusicid: string | null
        }
        Insert: {
          albumid?: number | null
          albumpartid?: number | null
          artist?: string | null
          bpm?: number | null
          bpmlock?: boolean
          comments?: string | null
          curator?: string | null
          dateadded: string
          dupeid?: number | null
          durationinms?: number | null
          energy?: number | null
          featuring?: string | null
          filepath?: string | null
          googlesongid?: string | null
          id?: number
          lowquality?: boolean
          musicvideoid?: number | null
          rating?: number | null
          remixer?: string | null
          resongid?: number | null
          search_text?: string | null
          spotifyid?: string | null
          title?: string | null
          tonickey?: string | null
          tonickeylock?: boolean
          track?: string | null
          trashed?: boolean
          youtubeid?: string | null
          youtubemusicid?: string | null
        }
        Update: {
          albumid?: number | null
          albumpartid?: number | null
          artist?: string | null
          bpm?: number | null
          bpmlock?: boolean
          comments?: string | null
          curator?: string | null
          dateadded?: string
          dupeid?: number | null
          durationinms?: number | null
          energy?: number | null
          featuring?: string | null
          filepath?: string | null
          googlesongid?: string | null
          id?: number
          lowquality?: boolean
          musicvideoid?: number | null
          rating?: number | null
          remixer?: string | null
          resongid?: number | null
          search_text?: string | null
          spotifyid?: string | null
          title?: string | null
          tonickey?: string | null
          tonickeylock?: boolean
          track?: string | null
          trashed?: boolean
          youtubeid?: string | null
          youtubemusicid?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "songs_albumid_fkey"
            columns: ["albumid"]
            isOneToOne: false
            referencedRelation: "albums"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "songs_albumpartid_fkey"
            columns: ["albumpartid"]
            isOneToOne: false
            referencedRelation: "albumparts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "songs_dupeid_fkey"
            columns: ["dupeid"]
            isOneToOne: false
            referencedRelation: "songs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "songs_musicvideoid_fkey"
            columns: ["musicvideoid"]
            isOneToOne: false
            referencedRelation: "musicvideos"
            referencedColumns: ["id"]
          },
        ]
      }
      songstyles: {
        Row: {
          songid: number
          styleid: number
        }
        Insert: {
          songid: number
          styleid: number
        }
        Update: {
          songid?: number
          styleid?: number
        }
        Relationships: [
          {
            foreignKeyName: "songstyles_songid_fkey"
            columns: ["songid"]
            isOneToOne: false
            referencedRelation: "songs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "songstyles_styleid_fkey"
            columns: ["styleid"]
            isOneToOne: false
            referencedRelation: "styles"
            referencedColumns: ["id"]
          },
        ]
      }
      stylechildren: {
        Row: {
          childid: number
          parentid: number
        }
        Insert: {
          childid: number
          parentid: number
        }
        Update: {
          childid?: number
          parentid?: number
        }
        Relationships: [
          {
            foreignKeyName: "stylechildren_childid_fkey"
            columns: ["childid"]
            isOneToOne: false
            referencedRelation: "styles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "stylechildren_parentid_fkey"
            columns: ["parentid"]
            isOneToOne: false
            referencedRelation: "styles"
            referencedColumns: ["id"]
          },
        ]
      }
      styles: {
        Row: {
          description: string | null
          id: number
          name: string | null
          reid: number | null
          relabel: string | null
        }
        Insert: {
          description?: string | null
          id?: number
          name?: string | null
          reid?: number | null
          relabel?: string | null
        }
        Update: {
          description?: string | null
          id?: number
          name?: string | null
          reid?: number | null
          relabel?: string | null
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

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const
