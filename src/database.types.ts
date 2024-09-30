export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      albumparts: {
        Row: {
          albumId: number
          id: number
          name: string | null
          pos: string
        }
        Insert: {
          albumId: number
          id?: number
          name?: string | null
          pos: string
        }
        Update: {
          albumId?: number
          id?: number
          name?: string | null
          pos?: string
        }
        Relationships: [
          {
            foreignKeyName: "AlbumParts_albumId_fkey"
            columns: ["albumId"]
            isOneToOne: false
            referencedRelation: "albums"
            referencedColumns: ["id"]
          },
        ]
      }
      albums: {
        Row: {
          artist: string | null
          basicGenreId: number | null
          catalogId: string | null
          coverFilepath: string | null
          id: number
          label: string | null
          mixed: boolean
          name: string | null
          releaseDateDay: number | null
          releaseDateMonth: number | null
          releaseDateYear: number | null
        }
        Insert: {
          artist?: string | null
          basicGenreId?: number | null
          catalogId?: string | null
          coverFilepath?: string | null
          id?: number
          label?: string | null
          mixed?: boolean
          name?: string | null
          releaseDateDay?: number | null
          releaseDateMonth?: number | null
          releaseDateYear?: number | null
        }
        Update: {
          artist?: string | null
          basicGenreId?: number | null
          catalogId?: string | null
          coverFilepath?: string | null
          id?: number
          label?: string | null
          mixed?: boolean
          name?: string | null
          releaseDateDay?: number | null
          releaseDateMonth?: number | null
          releaseDateYear?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "Albums_basicGenreId_fkey"
            columns: ["basicGenreId"]
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
          createdAt: string
          field: string | null
          id: number
          key: number | null
          table: string | null
          value: string | null
        }
        Insert: {
          createdAt?: string
          field?: string | null
          id?: number
          key?: number | null
          table?: string | null
          value?: string | null
        }
        Update: {
          createdAt?: string
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
          bpmDiff: number | null
          comments: string | null
          id: number
          inSongId: number
          outSongId: number
          rating: number | null
        }
        Insert: {
          addon?: boolean
          bpmDiff?: number | null
          comments?: string | null
          id?: number
          inSongId: number
          outSongId: number
          rating?: number | null
        }
        Update: {
          addon?: boolean
          bpmDiff?: number | null
          comments?: string | null
          id?: number
          inSongId?: number
          outSongId?: number
          rating?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "Mixes_inSongId_fkey"
            columns: ["inSongId"]
            isOneToOne: false
            referencedRelation: "songs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "Mixes_outSongId_fkey"
            columns: ["outSongId"]
            isOneToOne: false
            referencedRelation: "songs"
            referencedColumns: ["id"]
          },
        ]
      }
      musicvideos: {
        Row: {
          filePath: string | null
          id: number
          thumbnailFilePath: string | null
        }
        Insert: {
          filePath?: string | null
          id?: number
          thumbnailFilePath?: string | null
        }
        Update: {
          filePath?: string | null
          id?: number
          thumbnailFilePath?: string | null
        }
        Relationships: []
      }
      playlistentries: {
        Row: {
          id: number
          playlistId: number
          position: number | null
          songId: number
        }
        Insert: {
          id?: number
          playlistId: number
          position?: number | null
          songId: number
        }
        Update: {
          id?: number
          playlistId?: number
          position?: number | null
          songId?: number
        }
        Relationships: [
          {
            foreignKeyName: "PlaylistEntries_playlistId_fkey"
            columns: ["playlistId"]
            isOneToOne: false
            referencedRelation: "playlists"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "PlaylistEntries_songId_fkey"
            columns: ["songId"]
            isOneToOne: false
            referencedRelation: "songs"
            referencedColumns: ["id"]
          },
        ]
      }
      playlists: {
        Row: {
          gmusicId: string | null
          id: number
          name: string | null
          query: string | null
          spotifyId: string | null
          youtubeId: string | null
        }
        Insert: {
          gmusicId?: string | null
          id?: number
          name?: string | null
          query?: string | null
          spotifyId?: string | null
          youtubeId?: string | null
        }
        Update: {
          gmusicId?: string | null
          id?: number
          name?: string | null
          query?: string | null
          spotifyId?: string | null
          youtubeId?: string | null
        }
        Relationships: []
      }
      playliststyles: {
        Row: {
          playlistId: number
          styleId: number
        }
        Insert: {
          playlistId: number
          styleId: number
        }
        Update: {
          playlistId?: number
          styleId?: number
        }
        Relationships: [
          {
            foreignKeyName: "PlaylistStyles_playlistId_fkey"
            columns: ["playlistId"]
            isOneToOne: false
            referencedRelation: "playlists"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "PlaylistStyles_styleId_fkey"
            columns: ["styleId"]
            isOneToOne: false
            referencedRelation: "styles"
            referencedColumns: ["id"]
          },
        ]
      }
      songs: {
        Row: {
          albumId: number | null
          albumPartId: number | null
          artist: string | null
          bpm: number | null
          bpmLock: boolean
          comments: string | null
          curator: string | null
          dateAdded: string
          dupeId: number | null
          durationInMs: number | null
          energy: number | null
          featuring: string | null
          filepath: string | null
          googleSongId: string | null
          id: number
          lowQuality: boolean
          musicVideoId: number | null
          rating: number | null
          remixer: string | null
          reSongId: number | null
          search_text: string | null
          spotifyId: string | null
          title: string | null
          tonicKey: string | null
          tonicKeyLock: boolean
          track: string | null
          trashed: boolean
          youtubeId: string | null
        }
        Insert: {
          albumId?: number | null
          albumPartId?: number | null
          artist?: string | null
          bpm?: number | null
          bpmLock?: boolean
          comments?: string | null
          curator?: string | null
          dateAdded: string
          dupeId?: number | null
          durationInMs?: number | null
          energy?: number | null
          featuring?: string | null
          filepath?: string | null
          googleSongId?: string | null
          id?: number
          lowQuality?: boolean
          musicVideoId?: number | null
          rating?: number | null
          remixer?: string | null
          reSongId?: number | null
          search_text?: string | null
          spotifyId?: string | null
          title?: string | null
          tonicKey?: string | null
          tonicKeyLock?: boolean
          track?: string | null
          trashed?: boolean
          youtubeId?: string | null
        }
        Update: {
          albumId?: number | null
          albumPartId?: number | null
          artist?: string | null
          bpm?: number | null
          bpmLock?: boolean
          comments?: string | null
          curator?: string | null
          dateAdded?: string
          dupeId?: number | null
          durationInMs?: number | null
          energy?: number | null
          featuring?: string | null
          filepath?: string | null
          googleSongId?: string | null
          id?: number
          lowQuality?: boolean
          musicVideoId?: number | null
          rating?: number | null
          remixer?: string | null
          reSongId?: number | null
          search_text?: string | null
          spotifyId?: string | null
          title?: string | null
          tonicKey?: string | null
          tonicKeyLock?: boolean
          track?: string | null
          trashed?: boolean
          youtubeId?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "Songs_albumId_fkey"
            columns: ["albumId"]
            isOneToOne: false
            referencedRelation: "albums"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "Songs_albumPartId_fkey"
            columns: ["albumPartId"]
            isOneToOne: false
            referencedRelation: "albumparts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "Songs_dupeId_fkey"
            columns: ["dupeId"]
            isOneToOne: false
            referencedRelation: "songs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "Songs_musicVideoId_fkey"
            columns: ["musicVideoId"]
            isOneToOne: false
            referencedRelation: "musicvideos"
            referencedColumns: ["id"]
          },
        ]
      }
      songstyles: {
        Row: {
          songId: number
          styleId: number
        }
        Insert: {
          songId: number
          styleId: number
        }
        Update: {
          songId?: number
          styleId?: number
        }
        Relationships: [
          {
            foreignKeyName: "SongStyles_songId_fkey"
            columns: ["songId"]
            isOneToOne: false
            referencedRelation: "songs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "SongStyles_styleId_fkey"
            columns: ["styleId"]
            isOneToOne: false
            referencedRelation: "styles"
            referencedColumns: ["id"]
          },
        ]
      }
      stylechildren: {
        Row: {
          childId: number
          parentId: number
        }
        Insert: {
          childId: number
          parentId: number
        }
        Update: {
          childId?: number
          parentId?: number
        }
        Relationships: [
          {
            foreignKeyName: "StyleChildren_childId_fkey"
            columns: ["childId"]
            isOneToOne: false
            referencedRelation: "styles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "StyleChildren_parentId_fkey"
            columns: ["parentId"]
            isOneToOne: false
            referencedRelation: "styles"
            referencedColumns: ["id"]
          },
        ]
      }
      styles: {
        Row: {
          id: number
          name: string | null
          reId: number | null
          reLabel: string | null
        }
        Insert: {
          id?: number
          name?: string | null
          reId?: number | null
          reLabel?: string | null
        }
        Update: {
          id?: number
          name?: string | null
          reId?: number | null
          reLabel?: string | null
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
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof (Database[PublicTableNameOrOptions["schema"]]["Tables"] &
        Database[PublicTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
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
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
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
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
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
    | { schema: keyof Database },
  EnumName extends PublicEnumNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = PublicEnumNameOrOptions extends { schema: keyof Database }
  ? Database[PublicEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : PublicEnumNameOrOptions extends keyof PublicSchema["Enums"]
    ? PublicSchema["Enums"][PublicEnumNameOrOptions]
    : never
